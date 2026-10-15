# SE4458 Assignment 2: Playlist REST API (Group 2)

Read this file and `TODO.md` first. Work through `TODO.md` in order, tick each box when done, and commit after each phase.

## What this project is

A university homework: build and deploy a simple **backend-only REST API** for a music **Playlist**, with a **public Swagger page**. No frontend.

Source files for reference (in `docs/`):
- `assignment.pdf`: the assignment text
- `mockup-playlist.jpg`: UI mockup showing what the API must support
- `mockup-remove-dialog.jpg`: the "Remove Song" confirmation dialog

### Assignment rules (from the PDF)
- Any framework is allowed. **We use NestJS + TypeScript.**
- Backend must be **publicly available with a Swagger page**.
- All data is stored **in memory** (no real database).
- Extra functionality is allowed.
- Deploy anywhere (Azure, AWS, Vercel, Render, ...). Using AI for deployment help is allowed.

### Deliverables
1. Link to the GitHub repo.
2. A `README.md` in the repo containing: the link to the source code, **design**, **assumptions**, and **issues encountered**.
3. Link to the live deployment (the example in the PDF ends in `/api-docs`, so Swagger lives at `/api-docs`).

## Tech stack
- NestJS (latest stable) with TypeScript, npm
- `@nestjs/swagger` for OpenAPI docs
- `class-validator` + `class-transformer` for DTO validation
- Jest + supertest for a few e2e tests (optional but nice)
- Deploy target: **Render** (free Web Service, `render.yaml` Blueprint). Not Vercel or plain Cloudflare Workers: serverless runtimes can reset in-memory data between requests. A Cloudflare Containers setup (`Dockerfile`, `wrangler.jsonc`, `cloudflare/worker.ts`) is kept as a paid-plan alternative.

## Data model: `Song`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | generated on create |
| `title` | string | required |
| `artist` | string | required |
| `album` | string | optional; included in search |
| `duration` | integer | **seconds**, required, > 0 |
| `genre` | string | required, e.g. "Pop", "R&B" |
| `isFavorite` | boolean | default `false` |
| `position` | integer | 1-based order in the playlist |
| `coverUrl` | string | optional image URL |

Storage: a plain array inside `SongsService`. No persistence. Data resets on restart (document this in the README).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/songs` | List songs. Query params below. |
| GET | `/songs/:id` | Get one song |
| POST | `/songs` | Add a song (appended at the end) |
| PUT | `/songs/:id` | Replace/edit all editable fields |
| PATCH | `/songs/:id` | Partial update |
| DELETE | `/songs/:id` | Remove a song, return the removed song, re-number positions |
| PATCH | `/songs/:id/favorite` | Toggle `isFavorite` |
| PATCH | `/songs/:id/position` | Body `{ "position": n }`: move the song, shift the others |
| GET | `/playlist/summary` | `{ totalSongs, totalDurationSeconds, totalDurationFormatted, favoriteCount }` |
| GET | `/genres` | Distinct genres (for the "All Genres" dropdown) |

### `GET /songs` query params
- `search`: case-insensitive substring match on title, artist **or** album
- `genre`: case-insensitive exact match
- `favorite`: `true` to return only favorites
- `sortBy`: `position` (default) | `title` | `artist` | `duration`
- `order`: `asc` (default) | `desc`

All params are optional and combinable. Sorting does not change stored `position` values.

### Status codes
- `200` for reads, updates, deletes
- `201` for create
- `400` for validation errors (unknown fields rejected, bad types, bad `position`, bad query values)
- `404` when an id does not exist

## Behavior details
- **Position** values are always contiguous `1..n`. Re-number after create, delete and move.
- Moving to a position outside `1..n` returns 400.
- **Summary** formatting: 1046 seconds becomes `"17 min 26 sec"` (matches the mockup header).
- Root `/` redirects to `/api-docs`.
- Enable CORS.
- Listen on `process.env.PORT || 3000`, host `0.0.0.0` (required on Render).
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

## Seed data (matches the mockup, so Swagger shows data immediately)

| # | Title | Artist | Album* | Duration (s) | Genre | Favorite |
|---|---|---|---|---|---|---|
| 1 | Blinding Lights | The Weeknd | After Hours | 212 (3:32) | Pop | yes |
| 2 | Levitating | Dua Lipa | Future Nostalgia | 220 (3:40) | Pop | no |
| 3 | Watermelon Sugar | Harry Styles | Fine Line | 214 (3:34) | Pop | yes |
| 4 | Save Your Tears | The Weeknd | After Hours | 246 (4:06) | R&B | no |
| 5 | Peaches | Justin Bieber | Justice | 154 (2:34) | Pop | yes |

*Album is not visible in the mockup; the real album names are used so search by album works. Mention this in README assumptions.

Total = 1046 s = 17 min 26 sec. This must match `GET /playlist/summary`.

## Swagger requirements
- Served at `/api-docs` (`SwaggerModule.setup('api-docs', app, document)`).
- Title "Playlist API", short description, version.
- Every controller has `@ApiTags`; every endpoint has `@ApiOperation` and `@ApiResponse` for each status code it can return.
- DTO fields use `@ApiProperty` / `@ApiPropertyOptional` with `example` values so "Try it out" works with one click.

## Code conventions
- Structure: `src/songs/` (module, controller, service, `dto/`, `entities/`), `src/playlist/` (summary controller), `src/main.ts`.
- Keep business logic in services, controllers thin.
- Throw Nest exceptions (`NotFoundException`, `BadRequestException`), not raw errors.
- Small, focused commits. Do not commit `node_modules` or `dist`.

## README.md must include (graded)
1. Links: GitHub repo and live deployment / Swagger URL
2. Project overview and tech stack
3. **Design**: architecture, data model, endpoint table, how sorting/filtering/positioning work
4. **Assumptions**: for example duration in seconds, in-memory data resets on restart, no auth, album names added to seed data, the delete confirmation dialog is frontend-only
5. **Issues encountered**: real problems hit during development and deployment (keep notes in the "Issues log" section of `TODO.md` as you go, then copy them over)
6. How to run locally and run tests

## Things Claude should NOT do
- Do not add a database, ORM or auth.
- Do not build a frontend.
- Do not invent deployment URLs or GitHub links. Leave placeholders until the user provides the real ones.
- Creating the GitHub repo and doing the Render deployment needs the user's accounts. Prepare everything, give exact steps, and let the user do the account-specific clicks (or use `gh` if the user has it set up).
