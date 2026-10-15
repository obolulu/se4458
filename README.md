# Playlist API (SE4458 Assignment 2, Group 2)

A backend-only REST API for the music **Playlist** screen from the assignment mockup. It supports adding, editing, removing, searching, sorting, filtering by genre, favoriting and reordering songs. Every endpoint is documented and testable from a public Swagger page.

## Links

| | |
|---|---|
| Source code | https://github.com/obolulu/se4458 |
| Live Swagger | `<CLOUDFLARE_URL>/api-docs` |

> The live server runs in a Cloudflare Container that sleeps after 15 minutes without traffic, so the first request after a pause can take a few seconds while it starts.

## Tech stack

- **NestJS 11** with **TypeScript** on **Node.js 20+**
- **@nestjs/swagger** for the OpenAPI document and Swagger UI at `/api-docs`
- **class-validator / class-transformer** for request validation
- **Jest + supertest** for unit and end-to-end tests
- Deployed on **Cloudflare Containers**: a small Worker forwards every request to one container running the app (see [Deployment](#deployment-cloudflare))

## Design

### Architecture

```
HTTP request
   │
   ▼
Global ValidationPipe  ── rejects bad bodies / query params with 400
   │
   ▼
Controllers (thin)     ── SongsController (/songs), PlaylistController (/playlist/summary, /genres),
   │                      AppController (/ redirect, /health)
   ▼
SongsService           ── all business logic: filter, sort, positions, summary
   │
   ▼
In-memory Song[]       ── seeded with the 5 mockup songs on startup
```

```
src/
├── main.ts                 bootstrap: PORT / 0.0.0.0
├── app.setup.ts            ValidationPipe, CORS, Swagger (shared with the e2e tests)
├── app.module.ts
├── app.controller.ts       GET / → /api-docs, GET /health
├── common/
│   └── error-response.dto.ts
├── songs/
│   ├── songs.module.ts
│   ├── songs.controller.ts
│   ├── songs.service.ts
│   ├── songs.seed.ts
│   ├── dto/                create, update, move-position, query DTOs
│   └── entities/           Song, PlaylistSummary
└── playlist/
    ├── playlist.module.ts
    └── playlist.controller.ts
```

`SongsService` is the single source of truth. It keeps the songs in an array that is always in playlist order, so `array index + 1 === position`. `PlaylistController` reuses the same service instance, which `SongsModule` exports.

### Data model: `Song`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | generated on create; the seed songs have fixed ids |
| `title` | string | required, non-empty |
| `artist` | string | required, non-empty |
| `album` | string | optional; included in search |
| `duration` | integer | **seconds**, required, ≥ 1 |
| `genre` | string | required, e.g. `Pop`, `R&B` |
| `isFavorite` | boolean | defaults to `false` |
| `position` | integer | 1-based order in the playlist; managed by the server |
| `coverUrl` | string (URL) | optional cover image |

### Endpoints

| Method | Path | Purpose | Success | Errors |
|---|---|---|---|---|
| GET | `/songs` | List songs (search, filter, sort) | 200 | 400 |
| GET | `/songs/:id` | Get one song | 200 | 404 |
| POST | `/songs` | Add a song (appended at the end) | 201 | 400 |
| PUT | `/songs/:id` | Replace all editable fields | 200 | 400, 404 |
| PATCH | `/songs/:id` | Partial update | 200 | 400, 404 |
| DELETE | `/songs/:id` | Remove a song, return it, renumber the rest | 200 | 404 |
| PATCH | `/songs/:id/favorite` | Toggle `isFavorite` | 200 | 404 |
| PATCH | `/songs/:id/position` | Move a song, body `{ "position": n }`; returns the reordered playlist | 200 | 400, 404 |
| GET | `/playlist/summary` | `{ totalSongs, totalDurationSeconds, totalDurationFormatted, favoriteCount }` | 200 | |
| GET | `/genres` | Distinct genres for the "All Genres" dropdown | 200 | |
| GET | `/health` | Health check (`{ "status": "ok" }`) | 200 | |
| GET | `/` | Redirects to `/api-docs` | 302 | |

How the mockup maps to the API:

| Mockup element | Endpoint |
|---|---|
| "5 songs • 17 min 26 sec" header | `GET /playlist/summary` |
| Search box "songs, artist, or album" | `GET /songs?search=...` |
| "Sort by: Title (A–Z)" and the sortable column headers | `GET /songs?sortBy=title&order=asc` |
| "All Genres" dropdown | `GET /genres`, then `GET /songs?genre=...` |
| Star icon | `PATCH /songs/:id/favorite` |
| Pencil icon (edit) | `PUT` or `PATCH /songs/:id` |
| Drag handle (⋮⋮) | `PATCH /songs/:id/position` |
| Blue "+" button | `POST /songs` |
| "Remove Song" dialog → Remove | `DELETE /songs/:id` |

### Filtering and sorting (`GET /songs`)

All query parameters are optional and can be combined. Filters run first, then sorting.

| Param | Values | Behavior |
|---|---|---|
| `search` | text | Case-insensitive substring match on **title, artist or album** |
| `genre` | text | Case-insensitive **exact** match (`pop` matches `Pop`). Encode `&` as `%26`: `genre=R%26B` |
| `favorite` | `true` / `false` | `true` returns only favorites, `false` only non-favorites |
| `sortBy` | `position` (default), `title`, `artist`, `duration` | Text is compared case-insensitively; ties keep playlist order |
| `order` | `asc` (default), `desc` | |

Unknown parameters or invalid values (e.g. `sortBy=year`, `favorite=yes`) return **400**. Sorting only changes the order of the response. It never changes the stored `position` values.

### Positioning

- Positions are always contiguous `1..n`.
- **Create** appends the song at position `n + 1`.
- **Delete** removes the song and renumbers the rest, so deleting song 1 turns positions `2..5` into `1..4`.
- **Move** (`PATCH /songs/:id/position`) takes the song out and inserts it at the new index; the songs in between shift by one. Moving song 5 to position 1 gives `5, 1, 2, 3, 4`. The response is the whole playlist in its new order, so a client can redraw the list after a drag-and-drop.
- A position outside `1..n`, or one that is not an integer, returns **400**.
- `position` cannot be set through POST, PUT or PATCH; it is changed only by the move endpoint.

### Validation and errors

A global `ValidationPipe` runs with `whitelist`, `forbidNonWhitelisted` and `transform`:

- Unknown fields (including `id` and `position` in a body) → **400** `property foo should not exist`
- Wrong types (e.g. `"duration": "230"`), empty required strings, `duration < 1`, an invalid `coverUrl` → **400**
- Unknown id → **404** `Song with id "..." not found`

Errors use Nest's standard shape: `{ "statusCode": 400, "message": [...], "error": "Bad Request" }`.

### Summary

`totalDurationFormatted` is `"<minutes> min <seconds> sec"`, which matches the mockup header. The seed data adds up to 1046 seconds, so it reads `"17 min 26 sec"`.

## Assumptions

- **Duration is stored in whole seconds.** The mockup's `3:32` is 212 seconds. Clients format it for display.
- **Data lives in memory only.** There is no database, as the assignment requires. Everything resets to the 5 seed songs when the server restarts, and on Cloudflare that also happens when the container starts again after sleeping.
- **There is no authentication.** It is a single shared playlist.
- **Album names were added to the seed data.** The mockup does not show albums, but the search box says "songs, artist, or album", so the real album names were used (After Hours, Future Nostalgia, Fine Line, Justice).
- **Cover images:** the seed songs use placeholder images from `picsum.photos`, since the mockup's album art is not available as files.
- **The "Remove Song" confirmation dialog is frontend-only.** The API's `DELETE` removes the song directly and returns it, so a client can show its title or offer an undo.
- **PUT is a full replace.** All required fields must be sent; omitted optional fields (`album`, `coverUrl`) are cleared and `isFavorite` falls back to `false`. `id` and `position` are kept.
- **PATCH is a partial update.** Sending `null` clears `album` or `coverUrl`; `null` for a required field returns 400.
- **Moving a song returns the whole playlist** rather than just the moved song, because a move changes the positions of other songs too.
- Genres are free text. `GET /genres` dedupes them case-insensitively and keeps the first spelling.
- Unknown ids return 404 whatever their format; ids are not checked to be UUIDs.

## Issues encountered

1. **Nest CLI 12 crashed on scaffold.** `npx @nestjs/cli@latest new` failed with `ERR_REQUIRE_CYCLE_MODULE` (cannot `require()` the ES module `ora`). CLI 12 pulls in an ESM-only version of `ora` through `@angular-devkit/schematics`, and that hits a `require(esm)` bug in Node 22.12. **Fix:** scaffolded with `npx @nestjs/cli@11` instead.
2. **`@nestjs/swagger` peer-dependency conflict.** A plain `npm i @nestjs/swagger` installed v12, which needs `@nestjs/common@^12`, while the CLI 11 scaffold uses Nest 11. npm stopped with `ERESOLVE`. **Fix:** installed `@nestjs/swagger@^11` to match the other Nest packages, instead of forcing it with `--legacy-peer-deps`.
3. **Boolean query parameters** (caught while writing the query DTO). Query strings always arrive as text. Implicit type conversion would turn `?favorite=false` into `true`, because any non-empty string is truthy. **Fix:** an explicit `@Transform` maps `"true"`/`"false"` to booleans, and `@IsBoolean` rejects anything else with 400.
4. **CRLF line endings on Windows.** Git's `core.autocrlf` converted files to CRLF while Prettier expects LF, which made every `git add` print warnings and could make lint fail on checkout. **Fix:** a `.gitattributes` with `* text=auto eol=lf`.
5. **`R&B` in query strings.** `?genre=R&B` is read as `genre=R` plus an empty `B` parameter, which fails as an unknown parameter. The `&` must be encoded: `?genre=R%26B`. Swagger UI encodes it automatically.
6. **Swagger tag order.** Swagger listed tags in the order the controllers were registered, so "Health" appeared before "Songs". **Fix:** declared the tags explicitly with `DocumentBuilder.addTag()`.
7. **PATCH with `null`** (caught while writing the update logic). `PartialType` marks every field `@IsOptional()`, and class-validator skips validation for `null` too, so `{"title": null}` would have passed. **Fix:** the service rejects `null` for required fields with 400 and treats `null` as "clear" for the optional ones.
8. **Cloudflare showed "Hello World" instead of the API.** The first Cloudflare setup created a plain Worker, which runs Cloudflare's starter code in V8 isolates, not a long-running Node server, so none of the NestJS app was running. Plain Workers also can't keep in-memory data reliably, because requests can reach different, short-lived isolates. **Fix:** deploy with **Cloudflare Containers**. A `Dockerfile` builds the app image, and a small Worker (`cloudflare/worker.ts`) forwards every request to one container instance (`max_instances: 1`), so all users share one in-memory playlist.
9. **Wrangler needs Docker to deploy containers locally.** `wrangler deploy`, even with `--dry-run`, fails without the Docker CLI because it builds the image first. **Fix:** deploy through Cloudflare's Git integration (Workers Builds), which builds the Dockerfile on Cloudflare's side, so no local Docker is needed.

## Run locally

Requirements: Node.js 20 or newer, npm.

```bash
npm install
npm run start:dev
```

Open http://localhost:3000/api-docs. The root URL `/` redirects there. The port can be changed with the `PORT` environment variable.

Production build:

```bash
npm run build
npm run start:prod
```

## Tests

```bash
npm test            # unit tests (SongsService: moving, renumbering, formatting)
npm run test:e2e    # end-to-end tests for every endpoint, including 400/404 cases
```

The e2e tests start the real app with the same global configuration (`configureApp`) and a fresh in-memory store for each test.

## Deployment (Cloudflare)

The app is a normal long-running Node server, so it runs in a **Cloudflare Container**:

```
request ─▶ Worker (cloudflare/worker.ts) ─▶ PlaylistContainer (1 instance, Dockerfile) ─▶ NestJS on port 3000
```

| File | Purpose |
|---|---|
| `Dockerfile` | Two-stage build: `npm ci` + `npm run build`, then a slim image with production dependencies and `dist/`, started with `node dist/main` on port 3000 |
| `.dockerignore` | Keeps `node_modules`, `dist`, tests and docs out of the image |
| `wrangler.jsonc` | Worker name, the container (`instance_type: lite`, `max_instances: 1`) and its Durable Object binding |
| `cloudflare/worker.ts` | Forwards every request to the single container. It sleeps after 15 idle minutes. |

Requirements: a Cloudflare account on the **Workers Paid plan** (Containers are not available on the free plan).

Steps (no local Docker needed):

1. In the Cloudflare dashboard, open **Workers & Pages → Create → Import a repository**, and pick this GitHub repo.
2. Set the project name to **`se4458`**. It must match `name` in `wrangler.jsonc`, or the build fails.
3. Keep the defaults: root directory `/`, deploy command `npx wrangler deploy`.
4. Click **Deploy**. Cloudflare installs the dependencies, builds the Docker image and starts the Worker. The first deploy takes a few minutes, and requests can fail for a few minutes after it while the container is provisioned.
5. Open `https://se4458.<your-subdomain>.workers.dev/api-docs`.

Every push to `main` redeploys automatically.

Deploying from your own machine with `npx wrangler login` and then `npx wrangler deploy` also works, but needs Docker Desktop running.

### Alternative: Render

The same code runs on Render's free plan with no Cloudflare files involved:

1. On [Render](https://render.com), choose **New → Web Service** and connect the repository.
2. Runtime **Node**, build command `npm install && npm run build`, start command `npm run start:prod`, instance type **Free**, health check path `/health`.
3. Render sets `PORT`, and the app listens on `0.0.0.0:$PORT`. Swagger is then at `https://<service>.onrender.com/api-docs`.

A long-running host (a container or a Render Web Service) is needed because the data lives in memory. On serverless platforms such as Vercel or plain Cloudflare Workers, each request can hit a fresh instance and lose it.
