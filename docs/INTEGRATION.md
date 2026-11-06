# What runs, and where

| Capability | Public release | Tested in the full prototype |
| --- | --- | --- |
| Natural-language discovery | Optional real Muse Spark web research in a fixed Venice scope. | Map-scoped discovery, cited responses and candidate matching in the full application. |
| Source checks | Accept known ID + matching official page + native citation range on the result line. Render all prose as text. | Additional editorial checks and holds. Private implementation. |
| Descriptions | Every saved venue has its bundled description and official link. Saving from a live result also keeps the cited explanation on its guide page. | Cited research and structuring of editorial drafts. |
| Illustrations | Three Meta Muse Image illustrations regenerated on Nov 5, with accessible credits and file-level provenance. Served as bundled assets; no live image generation in this public app. | Meta generates draft illustrations behind an Editor review step. |
| Persistence | SQLite saves are shared on this local demo server. | Shared demo collection and separate private profiles. |
| Guides | The cover is separate. Each saved venue has a numbered guide page and a matching map pin. | Pocket guide with a larger research library. |

## Actual calls

The release sends one explicit request per live search. See [the complete public request and response adapter](../src/discovery.mjs) and [the opt-in command](../scripts/live-check.mjs). It supplies a bounded list of three candidates, a traveller question and a web search tool. A completed tool call is required. An ID alone cannot become a result. A citation to a different venue, a failed search or a malformed result never silently switches modes. The offline search and the mocked transport used in tests are labelled separately.

| Model and endpoint | Purpose | Evidence and availability |
| --- | --- | --- |
| `muse-spark-1.3`, `POST /v1/responses` with `web_search` | Research and explain relevant candidates. | Live-tested through the release adapter on Nov 4. [Sanitized result](live-example.json). Judge can repeat it with a key. |
| `muse-spark-1.3`, `POST /v1/chat/completions` | The full prototype requests structured drafts and visual review data. | Identified in the full app integration. These private workflows are outside this release’s tests. |
| `muse-image-1.0`, `POST /v1/images/edits` | The full prototype generates an illustration draft using selected visual references. This same adapter generated the current bundled Venice art. | A Nov 4 test rendered a draft in the Editor. Three additional successful calls on Nov 5 produced the replacement assets: [provenance](artwork-provenance.json). No image call is made by this public app. |
| `muse-image-1.0`, `POST /v1/images/generations` | The prototype also has a prompt-based generation path. | Present in the full app adapter. This release did not repeat that call. |

All routes above refer to the Meta API host `https://api.meta.ai`. The live adapter sets `store: false`, enforces a timeout and rejects redirects. API/model availability depends on the judge’s account. The current provider failure leaves the prior saved collection intact; Sample mode remains available by explicit selection.

**Image provenance and integration labeling.** The runtime research integration is Meta Muse Spark; the full prototype's image integration is Meta Muse Image. The original release bundled three OpenAI-generated sample illustrations from a separate workflow. That export did not satisfy the project's Meta-only image requirement. On Nov 5, all three were regenerated through Meta's `muse-image-1.0` using only their original licensed photographs, and the screenshot and walkthrough were recaptured. This is an artwork replacement and integration clarification, not a claim that the original files were Meta outputs or that the correction predates submission. Each adaptation retains its photographer, source and license. See [the dated correction](ARTWORK-CORRECTION.md) and [sanitized generation records](artwork-provenance.json).

## Reproduction

- `npm start` starts the server using bundled public assets. No package installation or private path is required.
- `npm test` runs the server and search checks without credentials. They cover save order, older SQLite databases, restart persistence, tampered research, and [positive and negative search cases](../test/fixtures/search-cases.json).
- To run the browser checks, use `npm ci`, `npx playwright install chromium`, and `npm run test:browser`. On Linux, `npx playwright install --with-deps chromium` also installs system libraries. Both browser tests use temporary databases. One follows offline search through refresh and pin 1. The other uses a simulated Meta response to verify that the saved explanation survives that journey. The GitHub workflow runs both on Node 24.
- `npm run meta:eval` is an optional quality evaluation that uses your configured key for up to three billable searches. It compares the returned venues with the published answer key and checks for the exhibition name in the positive case. A correct official URL can still accompany an unsupported sentence. The CI fixtures exercise this distinction. A human reader can inspect the listing to assess the rest of the prose.
- `npm run artwork:check` verifies that every bundled illustration has a Meta generation record whose published-file hash matches the actual asset. This detects missing records and stale or substituted assets; it is not independent provider attestation.
- `npm run meta:check` sends one billable live text request. It exits unsuccessfully for missing credentials, model failure, empty results or insufficient source evidence. A tested output is bundled solely as evidence; it is never replayed by Live Meta.
- The [14-second Venice preview](WALKTHROUGH.md#public-venice-sample) shows the November 6 guide flow. The [Explore screenshot](explore.webp) shows the November 5 artwork correction. The separate [6:33 full prototype video](WALKTHROUGH.md#full-atlas-prototype) shows globe navigation and multi-city search. The Venice preview used offline Sample mode.
- The local server signs each cited live match. On Save it checks the venue, explanation and source before storing them. Visitors to the installation share saved explanations. Search questions and credentials are omitted from the save record. Removing a venue removes its saved explanation.
- To start with another empty collection, use another checkout. All state for the current installation lives beneath `.atlas/`, outside the files served to browsers.

## Boundary for judges

The local process serves files from the public directory plus three small API routes. It accepts requests to its own loopback host and requires same-origin JSON for writes. There is no Editor, upload, remote file fetcher, public model proxy URL override or private database connection. Only user-initiated live research calls Meta. A network deployment and public accessibility require a separate check following the owner’s release approval.
