-- Creative Intelligence 3.0 in the MCP read API. private.creative_mcp_analysis, which
-- curatit_mcp_get_post_v2 calls in detail and curatit_mcp_search_v2 calls compact for each hit,
-- still projected only the 2.0 fields, so get_post and get_carousel never showed the strategy,
-- creative decisions, data checks, when to use it and visual notes that every published analysis
-- now has. Same signature and grants, and every key it returned before is still there, so the
-- code deployed today reads it as it did.
--
-- Compact (each search hit) adds strategy_headline and strategy_summary, and the copy strategy's
-- tones, persuasion and cta. Detail (get_post_v2) adds the Creative DNA whole (`dna`), the
-- current version's slide records (`slide_records`), and the version and slide counts: the MCP
-- builds its analysis from these with the post page's own code (src/lib/creative/publicAnalysis.ts),
-- so the two can't disagree.
--
-- Also:
-- - Evidence goes up to the schema's 20 items. It stopped at 8, and 19 analyses have more.
-- - 'unknown', 'none' and 'other' are left out of the slide tags, the tones and persuasion, and cta.
--   They match no filter (creative_write_labels drops them too); a slide role that's one of them
--   comes back null.
-- - The note no longer says an editor reviewed each analysis. The 2026-10-13 analyses were approved
--   for publication in bulk, and every one still flags quality.needs_review.
--
-- Rollback: re-run private.creative_mcp_analysis from 20261011131743_creative_mcp_v2.sql, then
--   drop function private.creative_known(jsonb);

set lock_timeout = '5s';

-- A list of taxonomy slugs in order, without the ones that say nothing ('unknown', 'none',
-- 'other'); [] for anything that isn't a list
create function private.creative_known(p_values jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(v.value order by v.ordinality), '[]'::jsonb)
  from jsonb_array_elements_text(case when jsonb_typeof(p_values) = 'array' then p_values end) with ordinality v(value, ordinality)
  where v.value not in ('unknown', 'none', 'other');
$$;

-- A post's published analysis for the MCP, or null. p_detail adds the narrative slide by slide,
-- the Creative DNA and the slide records. Long text is clipped; there is no confidence score for
-- the analysis as a whole, since none has been measured (each decision carries its own).
create or replace function private.creative_mcp_analysis(p_post_id text, p_detail boolean default false)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'verified_status', 'approved',
    'analysis_version', a.current_version_id,
    'analysis_source', a.analysis_source,
    'taxonomy_version', a.taxonomy_version,
    'published_at', a.published_at,
    'image_analysis_complete', a.image_analysis_complete,
    'slides_analysed', a.processed_slides,
    'slides_total', a.expected_slides,
    'primary_type', a.creative_dna #>> '{primary_archetype,slug}',
    'secondary_types', coalesce((select jsonb_agg(e ->> 'slug') from jsonb_array_elements(a.creative_dna -> 'secondary_archetypes') e), '[]'),
    'objective', a.creative_dna #>> '{marketing_objective,slug}',
    'visual_styles', coalesce(a.creative_dna #> '{visual_system,imagery}', '[]'),
    'typography_categories', coalesce(a.creative_dna #> '{visual_system,typography}', '[]'),
    'layout_tags', coalesce(a.creative_dna #> '{visual_system,composition}', '[]'),
    'palette', coalesce(a.creative_dna #> '{visual_system,palette}', '[]'),
    'narrative_pattern', a.creative_dna #>> '{narrative,pattern}',
    'hook_technique', a.creative_dna #>> '{hook,technique}',
    'concept', left(a.creative_dna ->> 'concept', 200),
    'creative_summary', left(a.summary, 800),
    'strategy_headline', left(a.creative_dna ->> 'strategy_headline', 160),
    'strategy_summary', left(a.creative_dna ->> 'strategy_summary', 400),
    'tones', private.creative_known(a.creative_dna #> '{copy_strategy,tone}'),
    'persuasion', private.creative_known(a.creative_dna #> '{copy_strategy,persuasion}'),
    'cta', case when a.creative_dna #>> '{copy_strategy,cta}' not in ('unknown', 'none', 'other') then a.creative_dna #>> '{copy_strategy,cta}' end,
    'why_it_might_work', coalesce((
      select jsonb_agg(jsonb_build_object('hypothesis', left(e ->> 'hypothesis', 400), 'evidence', e -> 'evidence'))
      from jsonb_array_elements(a.creative_dna -> 'creative_rationale') e), '[]'),
    'takeaways', to_jsonb(a.takeaways[1:5]),
    'analysis_evidence', coalesce((
      select jsonb_agg(jsonb_build_object(
        'ref', x.e ->> 'ref',
        'observation', left(x.e ->> 'observation', 300),
        'quote', left(x.e ->> 'quote', 160),
        'slide', (select jsonb_build_object('position', i.position, 'bucket', i.bucket_id, 'path', i.path)
          from public.post_images i where i.post_id = a.post_id and 'slide:' || i.position = x.e ->> 'ref')) order by x.n)
      from (select e, n from jsonb_array_elements(a.creative_dna -> 'evidence') with ordinality t(e, n) order by n limit 20) x), '[]'),
    'note', 'AI-drafted analysis, approved for publication by Curatit. Rationale is hypothesis, not measured performance.'
  ) || case when p_detail then jsonb_build_object(
    'hook', jsonb_build_object(
      'technique', a.creative_dna #>> '{hook,technique}',
      'observed_text', left(a.creative_dna #>> '{hook,observed_text}', 240),
      'location', a.creative_dna #>> '{hook,location}'),
    'narrative', jsonb_build_object(
      'pattern', a.creative_dna #>> '{narrative,pattern}',
      'arc', left(a.creative_dna #>> '{narrative,arc}', 400),
      'slides', coalesce((
        select jsonb_agg(jsonb_build_object(
          'position', s.position,
          'role', case when s.role not in ('unknown', 'none', 'other') then s.role end,
          'headline', left(s.headline, 200),
          'observation', left(s.observation ->> 'observation', 300),
          'typography', private.creative_known(to_jsonb(s.typography)),
          'layout', private.creative_known(to_jsonb(s.layout)),
          'imagery', private.creative_known(to_jsonb(s.imagery)),
          'palette', private.creative_known(to_jsonb(s.palette)),
          'devices', private.creative_known(to_jsonb(s.devices)),
          'image', jsonb_build_object('bucket', i.bucket_id, 'path', i.path)) order by s.position)
        from public.post_slide_analyses s
        join public.post_images i on i.post_id = s.post_id and i.position = s.position
        where s.version_id = a.current_version_id), '[]')),
    'copy_strategy', a.creative_dna -> 'copy_strategy',
    'attention_mechanisms', coalesce(a.creative_dna -> 'attention_mechanisms', '[]'),
    'adaptation_ideas', coalesce(a.creative_dna -> 'adaptation_ideas', '[]'),
    'constraints_or_uncertainties', coalesce(a.creative_dna -> 'constraints_or_uncertainties', '[]'),
    -- What the post page reads (display.ts): the DNA and the current version's slide rows, never
    -- another version's
    'dna', a.creative_dna,
    'slide_records', coalesce((
      select jsonb_agg(jsonb_build_object('version_id', s.version_id, 'position', s.position, 'observation', s.observation) order by s.position)
      from public.post_slide_analyses s
      where s.version_id = a.current_version_id and s.post_id = a.post_id), '[]'),
    'current_version_id', a.current_version_id,
    'expected_slides', a.expected_slides,
    'processed_slides', a.processed_slides
  ) else '{}'::jsonb end
  from public.post_analyses a
  join public.instagram_posts p on p.id = a.post_id and p.is_published
  where a.post_id = p_post_id and a.published_at is not null and a.review_status = 'approved';
$$;

-- The same grants as before, and the helper's to match: the API roles run these as themselves
-- (security invoker), so RLS still decides what they read
revoke execute on function private.creative_mcp_analysis(text, boolean), private.creative_known(jsonb) from public, anon, authenticated;
grant execute on function private.creative_mcp_analysis(text, boolean), private.creative_known(jsonb) to anon, authenticated, service_role;
