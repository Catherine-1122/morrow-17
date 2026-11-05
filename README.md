# Atlas by Hado Labs
**Map Your World.** · Meta Global AI Developer Hackathon · Startup Track · Build for Your World · November 4, 2026

**Integration clarification · November 5, 2026.** Atlas uses Meta Muse Spark for live research and Meta Muse Image in the full prototype's illustration workflow. The original demo export included artwork from a separate generation workflow. This post-submission correction replaces all three bundled illustrations with verified Meta Muse Image outputs and refreshes the demo media. [Correction and generation evidence](docs/ARTWORK-CORRECTION.md).

A traveller asks what to see at the Finnish Pavilion. Atlas can research the question with Meta, show the source beside the place, and let the traveller decide whether to save it. The saved venue becomes a page and a pin in their pocket guide.

[![Animated Atlas walkthrough: search, save, and open the Venice pocket guide](docs/walkthrough.gif)](docs/WALKTHROUGH.md)

14-second silent preview in Sample mode. [Download the full-size MP4](https://github.com/Catherine-1122/morrow-17/raw/refs/heads/main/docs/walkthrough.mp4) · [Still screenshot](docs/explore.webp)

Travel planning often leaves the map pin in one app, the source in a search tab and the itinerary in someone’s notes. Atlas keeps those pieces together. This submission is a self-contained slice of the hackathon prototype built around three venues in Venice. [Watch the sample walkthrough](docs/WALKTHROUGH.md) · [Artwork and map credits](docs/CREDITS.md)

## Run the demo

Use **Node.js 24 or newer** with npm. From the root of this checkout:

```sh
npm start
```

Open [Atlas on this computer](http://127.0.0.1:4173). There are zero third-party runtime packages. Startup creates a local SQLite database in `.atlas/`. It begins empty, so you can see your first save become a guide. No account, API key, download of map tiles or production service is required for Sample mode. Official source links open external sites when clicked.

1. Open **Search**, leave **Sample · offline** selected and enter **Architecture in Venice**. In this mode, a deterministic search matches words against three public sample records. For a narrower example try **wind**.
2. Open **Finnish Pavilion**, inspect the source or image credit, and save it. Add another venue from Explore.
3. Open **Saved** and refresh. The places persist on this demo server. **Book** opens a digital pocket guide in save order. Open a page to read it, switch to **Map** and select its numbered pin, or unfold **Sketches**.

## Try real Meta research

Copy `.env.example` to `.env` and set `MODEL_API_KEY` to your own Meta API key with access to Muse Spark and web search. Restart `npm start`, select **Live Meta**, and ask **What can I see at the Finnish Pavilion in the Giardini?** Each submitted live search sends the question and the public venue list to Meta and uses your provider quota. The browser never receives the key.

To repeat the same live request from the terminal:

```sh
npm run meta:check
```

On November 4 we tested the public adapter against `muse-spark-1.3` at `POST https://api.meta.ai/v1/responses`. It used web search and returned a cited description of *Aeolian Suite*. The venue ID connected the answer to the existing map pin. Results can vary. [Actual sanitized response](docs/live-example.json) · [Integration and verification details](docs/INTEGRATION.md)

```mermaid
flowchart LR
  A[Visitor question] --> B{Research mode}
  B -->|Sample| C[Local venue index]
  B -->|Live| D[Node server]
  D --> E[Muse Spark + web search]
  E --> F[Check place ID and official citation]
  C --> G[Review place]
  F --> G
  G -->|Traveller saves| H[(Local SQLite)]
  H --> I[Illustrated guide and numbered map]
```

Meta interprets the live question, chooses relevant candidates, researches the listings and drafts a short explanation. The server accepts only known place IDs with a native citation on the same result line pointing to the venue’s listed official page. This check establishes the source of a result; the traveller can inspect the underlying claim. The map positions, edition artwork and guide copy come from the bundled samples. Saving is an explicit human decision.

## Three people shape Atlas

| Role | Hackathon product | What a judge can use here |
| --- | --- | --- |
| Explorer | Discover places, save research, collect stops on a map and build a personal guide. | The complete three-venue search, save and digital guide journey. |
| Place owner | Submit better listing information for review. Claim verification is a product goal. | Consumer-facing place information and official links. The owner workspace is private. |
| Platform editor | Review research, writing, illustration provenance and publication decisions. | Meta-generated illustrations with public credits and generation records. The editorial workspace is private. |

## What was built

During **October 26–November 4, 2026**, the Atlas prototype connected map-scoped discovery to Meta research, added illustrated place cards and review, and joined persistent saves to a foldable digital guide. The guide preview, map interaction, artwork-credit disclosures, place visuals and visual identity are drawn from the working hackathon app.

For this release we selected three venues, wrote short sample descriptions from public listings, and added an isolated Node HTTP server, a small public Meta adapter and an empty demo save database. The protected editorial data, scoring methods, comparison tools and internal prompts are outside this repository. Hado Labs’ earlier visual and editorial practices predate the hackathon. Third-party fonts, icons and map data have their own histories and licenses.

**Stack** · Node HTTP and built-in SQLite, browser ES modules, HTML and CSS, Hanken Grotesk, Lucide, a locally rendered Venice map and the Meta Responses API.

**Verification** · Run `npm test` for independent, credential-free tests of startup, sample loading, genuine save/restart behavior, request validation and simulated provider failures. Run `npm run artwork:check` to match the shipped artwork to its recorded hashes and Meta attribution. The live check above is opt-in. [Scope and test evidence](docs/INTEGRATION.md)

**Current limits** · Discovery covers three mapped venues. Guide order follows save order; route optimization, offline downloads and printed orders are future work. The digital preview is interactive. Browser visitors to the same installation share its sample saves. The app binds to loopback for local judging; a public hosted instance requires a separately reviewed deployment.

**Rights** · The repository includes no general open-source license for Hado Labs’ original code or brand. The contributed illustrations, font, icons and map carry the notices in [credits and licenses](docs/CREDITS.md).
