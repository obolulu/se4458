# TODO: Playlist API (SE4458 Assignment 2, Group 2)

Spec and decisions are in `CLAUDE.md`. Tick boxes as you go, commit after each phase.

## Phase 0: Setup
- [x] Check `node -v` (need an active LTS, 20+) and `npm -v`
- [x] Scaffold NestJS TypeScript project in this folder (`npx @nestjs/cli new` with npm, skip git init). If the CLI refuses a non-empty folder, scaffold in a temp subfolder and move the files up. Keep `CLAUDE.md`, `TODO.md`, `docs/`.
- [x] Install: `@nestjs/swagger class-validator class-transformer`
- [x] `git init`, add `.gitignore` (node_modules, dist, .env), first commit

## Phase 1: Core API
- [x] Generate `songs` module/controller/service
- [x] `Song` entity (see data model in CLAUDE.md)
- [x] DTOs: `CreateSongDto`, `UpdateSongDto`, `MovePositionDto`, `QuerySongsDto` (with validation + `@ApiProperty` examples)
- [x] Seed the 5 songs from the mockup in `SongsService`
- [x] `GET /songs` with `search`, `genre`, `favorite`, `sortBy`, `order`
- [x] `GET /songs/:id`
- [x] `POST /songs` (201, appended at end, UUID id)
- [x] `PUT /songs/:id` and `PATCH /songs/:id`
- [x] `DELETE /songs/:id` (returns removed song, re-numbers positions)
- [x] `PATCH /songs/:id/favorite` (toggle)
- [x] `PATCH /songs/:id/position` (move + shift, 400 if out of range)
- [x] `GET /playlist/summary` (`17 min 26 sec` for the seed data)
- [x] `GET /genres`
- [x] Commit

## Phase 2: App setup and Swagger
- [x] Global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- [x] CORS enabled
- [x] Swagger at `/api-docs` with title/description/version
- [x] `@ApiTags`, `@ApiOperation`, `@ApiResponse` on every endpoint
- [x] `/` redirects to `/api-docs`
- [x] Listen on `process.env.PORT || 3000` and `0.0.0.0`
- [x] Commit

## Phase 3: Verify locally
- [x] `npm run start:dev`, open `http://localhost:3000/api-docs`
- [x] Try every endpoint from Swagger, including the error cases (404 unknown id, 400 bad body, 400 bad position)
- [x] Check: search "weeknd" returns 2 songs, `genre=R&B` returns 1, `favorite=true` returns 3, sort by duration works asc and desc
- [x] Check: delete song 1 then positions are 1..4; move a song and the order shifts correctly
- [x] Check: summary matches the sum of durations
- [x] Add e2e tests (supertest) for the main flows and make `npm run test:e2e` pass
- [x] `npm run build` and `npm run start:prod` both work
- [x] Commit

## Phase 4: README
- [x] Write `README.md` with all sections listed in `CLAUDE.md` (leave the two link placeholders for now)
- [x] Endpoint table, design, assumptions, how to run, how to test
- [x] Commit

## Phase 5: GitHub (needs the user)
- [x] User creates a GitHub repo (public, or accessible to the instructor)
- [x] `git remote add origin ...` and push
- [x] Put the real repo link in the README

## Phase 6: Deploy to Render (needs the user)
- [ ] User creates a Render account and a new **Web Service** from the GitHub repo
- [ ] Runtime: Node. Build command: `npm install && npm run build`. Start command: `npm run start:prod`
- [ ] Free plan is fine (note: it sleeps after inactivity and data resets on restart; mention in README)
- [ ] Open `https://<service>.onrender.com/api-docs` and confirm Swagger loads with the seed data
- [ ] Put the live link in the README and push
- [ ] Re-test a few endpoints on the live URL

## Phase 7: Final check and submission
- [ ] README has: repo link, live link, design, assumptions, issues encountered
- [ ] Issues log below is copied into the README
- [ ] Fresh clone builds and runs from the README steps
- [ ] Submit: GitHub link + live Swagger link (format like the example in `docs/assignment.pdf`)

## Optional extras (only if time allows)
- [ ] Pagination on `GET /songs`
- [ ] `POST /songs/reorder` to set a full order at once
- [x] Health endpoint (`GET /health`)

## Issues log
Add each real problem as you hit it: what happened, cause, fix. These go into the README "Issues encountered" section.

- **Nest CLI 12 crashed on scaffold.** `npx @nestjs/cli@latest new` failed with `ERR_REQUIRE_CYCLE_MODULE` (cannot `require()` the ES module `ora`). Cause: CLI 12 pulls an ESM-only `ora` through `@angular-devkit/schematics`, which hits a `require(esm)` bug in Node 22.12. Fix: scaffolded with `npx @nestjs/cli@11` instead.
- **`@nestjs/swagger` peer-dependency conflict.** `npm i @nestjs/swagger` installed v12, which needs `@nestjs/common@^12`, but the CLI 11 scaffold uses Nest 11, so npm stopped with `ERESOLVE`. Fix: installed `@nestjs/swagger@^11` to match the Nest 11 packages, instead of forcing with `--legacy-peer-deps`.
- **CRLF line-ending warnings on Windows.** Every `git add` warned "LF will be replaced by CRLF" because Git's `core.autocrlf` is on, while Prettier formats files with LF. A checkout with CRLF endings would make the Prettier ESLint rule flag every line. Fix: added `.gitattributes` with `* text=auto eol=lf` so the repo always stores and checks out LF.
- **Unencoded `R&B` in query strings.** `?genre=R&B` is parsed as `genre=R` plus a stray `B` parameter, so the API answers 400 `property B should not exist`. Not a bug: clients must send `genre=R%26B` (Swagger UI encodes it). Documented in the README.
- **Swagger tag order.** Tags appeared in controller registration order ("Health" before "Songs"). Fix: `DocumentBuilder.addTag()` in the wanted order.
- **Boolean query param (found while writing the DTO).** Implicit conversion would turn `?favorite=false` into `true`. Fix: explicit `@Transform` + `@IsBoolean`.
- **PATCH with `null` (found while writing the update logic).** `PartialType` makes fields `@IsOptional()`, which also skips validation for `null`, so `{"title": null}` would pass. Fix: the service rejects `null` for required fields; `null` clears `album`/`coverUrl`.
