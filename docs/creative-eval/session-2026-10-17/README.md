# Image-reviewed analysis session

The two JSON files contain authored observations and analysis for 20 newly imported posts:
10 Postmates and 10 GoFundMe posts, covering all 47 stored images. They were saved as new
draft analyses through `creative_save_analysis`; none was published or attributed to a human reviewer.

The separate editorial audit covered all 217 existing analyses. It saved 203 corrections as
new immutable versions, retaining publication state and previous versions; 14 were unchanged.
That cleanup was not a fresh visual review of those 217 posts.

Database verification after saving: 237 posts, 237 analyses, 217 published, 20 new drafts,
zero missing analyses, zero exact check/constraint duplicates, and zero occurrences of the
old color-sampling disclaimer. All 580 classification jobs were in the succeeded state.

To serialize these reviewed notes again, use `scripts/maintenance/build-session-analyses.ts`
with a session directory containing these JSON files, fresh `new-manifests.json` records,
and the corresponding stored images at `images/<shortcode>/<zero-padded-position>.webp`.
Manifests and image assets are not embedded in this repository. Serialization validates
the schema and taxonomy and measures image colors; it does not perform a new visual review
or save anything to the database. Recheck manifests and concurrent versions before any save.

The authoring rules are in [creative-analysis-prompt.md](../../creative-analysis-prompt.md).
