# Meta integration clarification and artwork correction

**November 5, 2026 · Post-submission update**

Atlas's live research uses **Meta Muse Spark**. The full prototype's illustration workflow uses **Meta Muse Image**, with a draft review step. Those are real Meta integrations; the public demo serves previously generated illustrations instead of exposing the private editor or running image generation in the browser.

The original public export included three Venice sample illustrations generated with OpenAI in a separate workflow. Including them was an export error against the project's Meta-only image requirement. The earlier image-provider disclosure described those files, not the provider used by Atlas's runtime integrations. It would be inaccurate to describe the original artwork as Meta-generated or this correction as only a changed label.

On November 5, the three illustrations were regenerated using **`muse-image-1.0` at `POST https://api.meta.ai/v1/images/edits`** through the prototype's existing Meta adapter. Each request used its original licensed reference photograph as the sole image input. The earlier generated illustrations were not used as inputs or style references. Meta returned three PNG images at 1600 × 1600; those were resized to 960 × 960 and encoded as WebP for the demo. The screenshot and walkthrough were recaptured from this updated build.

[The provenance manifest](artwork-provenance.json) records each model, endpoint, completion time, provider timestamp, reference-photo hash, original output hash and published WebP hash. It omits credentials and private prompts. These are project-maintained records of successful API calls, not a provider-signed certificate. `npm run artwork:check` checks that the current bundled files match those records.

The drawings remain interpretations of dated photographs, not evidence of present-day exhibition installations. [Photographer credits and adaptation licenses](CREDITS.md) remain attached to each image. No new claim of owner or photographer approval is made.

The original submission commit remains in Git history. This correction is dated after submission and does not represent an image change made before the deadline. The public app's live research integration and feature scope are unchanged.
