<div align="center">

# 🗓️ Workshop Agenda Studio

**Make room for the good conversations.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue workshop planner with a previous-value computed timeline, time budgets, editable segments, and Markdown/JSON exports._

</div>

---

## ✨ Highlights

- **Build a useful running order:** Arrange 1–16 activities and breaks with durations and facilitator notes.
- **See the whole morning:** Derive exact start/end times, total minutes, and spare time or a budget overrun.
- **Keep the last clear plan:** A genuine Vue previous-value computed retains the complete timeline while a text field is invalid.
- **Make changes together:** Reorder by buttons, add a segment, or remove one with confirmation.
- **Take the plan with you:** Export the complete program as escaped Markdown or editable JSON.
- **Keep local drafts:** Valid changes persist; corrupt or blocked storage leaves a usable workspace.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── DataTools.vue                   # Workspace actions and confirmation
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── agenda.ts                      # Pure validation, calculations, and exports
│   ├── shared.ts                       # Identity and text guards; portable HTML where used
│   └── validation.ts                   # Strict unknown-input guards
├── composables/
│   └── useAgenda.ts                    # Previous-value computed timeline
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. Self-contained exported HTML carries its own styles where needed; all application layout and visible-state classes use Tailwind utilities. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The fictional **The community ideas morning** sample starts at 09:30. It contains four activities and a tea break totaling 100 minutes, with 20 minutes left in a 120-minute budget. The complete program ends at 11:10.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The same canonical sample is defined in the domain module for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

[`useAgenda` uses the previous result supplied to a Vue computed getter](https://vuejs.org/guide/essentials/computed.html#getting-the-previous-value). A separate computed validates the text editor. On success the plan returns a newly calculated, detached timeline; on failure it returns its previous value. An initial validated plan provides the fallback if the first read occurs during an invalid edit. The computed getter has no persistence or UI side effects.

The parent watches valid candidates and writes the canonical workspace. Duration and budget inputs keep textual drafts rather than coercing blanks to zero. Clearing a duration therefore leaves every last-valid segment, downstream time, and saved field intact. Correcting it publishes the new complete plan. A native time input provides HH:MM text; imports store minutes since local midnight.

Segments use stable identities across reorder and selection. A fixed-height timeline, list, and detail editor preserve neighboring panels. Selected fields edit the text draft; invalid pending input disables structural operations and Markdown export. JSON always preserves the last valid workspace. Complete imports and confirmed sample restoration replace the draft, including any pending invalid fields.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-workshop-agenda-studio:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Session-only selection, modes, pending forms, dialog text, and derived results are not exported as workspace state.

| Field                   | Accepted values                                             |
| ----------------------- | ----------------------------------------------------------- |
| `version`, `name`       | `1`; nonblank single-line title up to 80 characters         |
| `start`, `budget`       | Integer start minute 0–1439; budget 1–720 minutes           |
| `segments`              | 1–16 entries, with unique safe lowercase IDs                |
| Segment title / note    | Nonblank title up to 60 characters; optional note up to 240 |
| Segment duration / kind | Integer 1–180 minutes; `activity` or `break`                |

The sum of durations plus the start must not exceed 1440 minutes. Exactly midnight is a valid finish displayed as 24:00. The editor requires ordinary whole-minute strings and a valid HH:MM start; blanks, signs, decimals, and exponents are rejected.

Markdown contains the workshop name, start, total/budget, each segment’s time range/duration/kind, every nonempty facilitator note, and WA attribution. User Markdown syntax is escaped. JSON includes the complete validated program and provenance. The budget may be exceeded and exported; crossing local midnight is rejected.

Download Blob URLs are revoked after download. Destructive collection removal and sample restoration use native confirmation dialogs.

## ◈ Project Markers

- `WA` appears in the wordmark, project metadata, and workspace identity; original favicon and social artwork use its matching emblem.
- `WA-XXXXXXXX` is a deterministic 32-bit content stamp calculated from the canonical validated workspace, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- This is a sequential same-day agenda, with no parallel tracks, dates, time zones, calendar sync, or running timer.
- Segment ordering sets the schedule. Start/end fields are derived and are not independent appointments.
- The budget is a guide rather than a hard duration limit; overruns are shown explicitly.
- New segments use ten minutes. Adding is disabled if ten minutes would cross midnight or the collection limit is reached.
- Pending invalid edits keep the last valid timeline and device save. Export JSON before an import/restore if you want to retain that validated program.
- Text drafts and selection are session-only. Reload restores the last valid workspace.
- To add parallel sessions or dates, extend schema, calculations, editor, and exports together.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests cover the canonical sample, strict primitives and limits, exact schedule boundaries, textual minute parsing, actual Vue computed previous-value behavior, and Markdown escaping. Four domain browser tests exercise partial inputs, local times and budget overruns, reorder/add/confirmed removal with stable geometry, and actual Markdown downloads.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A separate maximum-content browser case checks the accepted collection/field bounds at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
