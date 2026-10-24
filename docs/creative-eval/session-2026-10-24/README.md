# Image-reviewed analysis session, 24 October 2026

The two JSON files hold authored observations and analysis for the 54 posts imported on 24 October from the
21 October Apify runs: 20 Betterment, 15 Airtasker (including Airtasker UK and four partner posts that carry
Airtasker as co-author) and 19 more Wealthsimple posts, covering all 232 stored images. They were written in a
Claude Code session, where five helpers each opened every image of their posts and wrote the notes, following
[creative-analysis-prompt.md](../../creative-analysis-prompt.md). The Claude Code worker wasn't used, at the
owner's request.

They were serialized with `scripts/maintenance/build-session-analyses.ts`
(`SESSION_MODEL_ID=claude-session-image-review`), which validated every post with no errors. Seven posts carry a
caveat because some of their slides are video covers, which only show a still frame. Each analysis was saved
through `creative_save_analysis` against its queued job, as the worker would, with `review_status: needs_review`.
None was published or attributed to a human reviewer, and every job ended as succeeded.

The notes name slides counting from zero, like the pipeline's own prose; the site shows them counting from one.
They were written counting from one and shifted down before the build wherever the analysis names a slide,
never in copied on-image text.

Database check after saving: 54 new analyses, all needs_review, 232 slide records, model
`claude-session-image-review`, nothing published.

Things the helpers flagged for an editor's eye:

- **Betterment `Dbd55tNFH8r`.** The Bonds row reads 48.0%, but its sub-rows add to 38.0%.
- **Betterment `DdkCkI7DYYd`.** $868 a year on $20,000 at 4.25% APY, where the year's interest at that rate is $850.
- **Betterment `Dd6_Kdll4Ul`.** A "Retail investor survey" label over an "Advisor Survey" footer.
- **Wealthsimple `DcCO-U0j0Cn`.** "as of DATE" is left in its fine print.
- **Wealthsimple `DcRU5XKFF91`.** Options losses are called "capped" beside a covered-call recommendation.

Each of these is a data check in its analysis.

To serialize these notes again, use a session directory holding these files, fresh `new-manifests.json`
records from `creative_post_manifest`, and the stored images at `images/<shortcode>/<two-digit position>.webp`.
