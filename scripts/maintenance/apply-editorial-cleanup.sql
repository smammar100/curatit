-- Reviewed data maintenance. Substitute __REVIEWED_PAYLOAD__ with the reviewed JSON array.
-- First run inside BEGIN / ROLLBACK and confirm the affected count, then commit.
do $cleanup$
declare item jsonb; base public.post_analysis_versions; curr public.post_analyses; vid uuid; vn integer;
begin
 for item in select value from jsonb_array_elements($payload$__REVIEWED_PAYLOAD__$payload$::jsonb) loop
  perform pg_advisory_xact_lock(hashtextextended('creative:' || (item->>'post_id'),0));
  select * into curr from public.post_analyses where post_id=item->>'post_id' for update;
  if curr.current_version_id is distinct from (item->>'based_on_id')::uuid then
    raise exception 'Analysis changed concurrently for %',item->>'post_id';
  end if;
  select * into base from public.post_analysis_versions where id=curr.current_version_id;
  if base.id is null then raise exception 'Missing original version'; end if;
  vid:=gen_random_uuid();
  select coalesce(max(version_no),0)+1 into vn from public.post_analysis_versions where post_id=curr.post_id;
  insert into public.post_analysis_versions
  select (jsonb_populate_record(null::public.post_analysis_versions,
    to_jsonb(base)||jsonb_build_object('id',vid,'version_no',vn,'based_on_id',base.id,
    'source','ai','created_by',null,'created_at',now(),'reviewed_by',null,'reviewed_at',now(),
    'review_note','Owner-requested editorial cleanup 2026-10-17: remove boilerplate and duplicate caveats; original visual analysis and slides retained. Not a new visual review.',
    'creative_dna',base.creative_dna||jsonb_build_object(
       'integrity_notes',item->'integrity_notes','constraints_or_uncertainties',item->'constraints_or_uncertainties','quality',item->'quality'),
    'validation',base.validation||jsonb_build_object('editorial_cleanup','2026-10-17','original_version',base.id))
  )).*;
  insert into public.post_slide_analyses
    (version_id,post_id,position,role,headline,body,legibility,text_density,typography,type_weight,layout,imagery,palette,palette_hex,devices,product_prominence,people_prominence,confidence,observation)
  select vid,post_id,position,role,headline,body,legibility,text_density,typography,type_weight,layout,imagery,palette,palette_hex,devices,product_prominence,people_prominence,confidence,observation from public.post_slide_analyses where version_id=base.id;
  perform private.creative_apply_version(vid,curr.review_status,curr.published_at is not null);
  insert into public.creative_review_events(post_id,version_id,action,note)
    values(curr.post_id,vid,'edit','Owner-requested AI editorial cleanup 2026-10-17; retained approved publication state and preserved previous version. No human reviewer impersonated.');
 end loop;
end $cleanup$;
