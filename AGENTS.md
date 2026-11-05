# Atlas artwork requirements

- All AI-generated illustrations added to this repository must use Meta image models. Do not use another provider or silently fall back when Meta is unavailable.
- Record the actual provider, model, endpoint, generation date, reference sources and file hashes in `docs/artwork-provenance.json`. Never relabel an existing asset as Meta-generated without supporting generation records.
- Keep photographer attribution and applicable licenses with adaptations. Do not publish private prompts, credentials or editorial data.
- Refresh screenshots and walkthroughs when their artwork changes. Keep post-submission corrections explicitly dated; preserve the original history.
- Before publishing an artwork change, run `npm test` and `npm run artwork:check`, and inspect the rendered app.
