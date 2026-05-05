# HookScore Mobile Draft

Expo React Native app for preparing a short opening clip and the future HookScore GPT request.

## Run

```sh
npm install
npm run web
npm run ios
npm run android
npm run typecheck
```

If npm hits a global cache permission issue, use a local cache:

```sh
npm install --cache /private/tmp/hook-score-npm-cache
```

## Environments

Development values live in `.env.development.local`; production values live in `.env.production.local`. Both files are ignored by git through the existing `.env*.local` rule. `EXPO_PUBLIC_ENVIRONMENT_MESSAGE` is rendered on the Settings screen so you can verify which env file is active.

Expo only exposes variables prefixed with `EXPO_PUBLIC_` to the mobile bundle. Treat those as public client values; keep real production secrets behind a backend when this app is ready to ship.

Supabase Auth needs these public client values:

```sh
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`EXPO_PUBLIC_SUPABASE_ANON_KEY` is also accepted as a fallback while Supabase projects transition from legacy anon keys to publishable keys.

The app chooses an auth confirmation redirect automatically:

- Web: the current origin, for example `http://localhost:8081`
- Native: `hookscore://auth/callback`

Set `EXPO_PUBLIC_AUTH_REDIRECT_URL` only when you need to force a specific callback URL for a build or environment.

Video analysis runs directly in the app for the MVP. The app samples image frames from the selected 3-5 second opening window and sends those images plus the user's context to the selected AI provider. On web builds with Gemini, HookScore also extracts a tiny mono WAV sample from the same opening window and sends it with the frame request so the analyzer can judge speech, music, silence, and audio-visual fit. This intentionally avoids a separate backend, but it also means provider API keys are embedded in the client bundle and should only be used for local MVP testing.

```sh
EXPO_PUBLIC_AI_PROVIDER=gemini
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash
```

OpenAI is also available:

```sh
EXPO_PUBLIC_AI_PROVIDER=openai
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_OPENAI_MODEL=gpt-5.4-mini
```

Use `EXPO_PUBLIC_GEMINI_MODEL` or `EXPO_PUBLIC_OPENAI_MODEL` to switch models for the active provider.

API request and response logs are enabled in development by default. They cover Supabase network calls plus Gemini/OpenAI analyzer requests and responses, with API keys, auth tokens, passwords, cookies, and large image/base64 payloads redacted or summarized. Log payloads are emitted as JSON strings so Expo and React Native consoles do not collapse objects into `[object Object]`.

```sh
EXPO_PUBLIC_API_DEBUG_LOGS=true
```

Set `EXPO_PUBLIC_API_DEBUG_LOGS=false` to silence the network logs in development, or set it to `true` temporarily in another testing environment.

```sh
npm run start:dev
npm run start:prod
npm run web:dev
npm run web:prod
```

`start:prod` and `web:prod` use `--no-dev --minify --clear` so Expo serves a production bundle with `.env.production.local` values instead of the development virtual env module.

## Architecture

- `src/application`: root providers and navigation.
- `src/features/*/containers/*.container.tsx`: navigation-facing containers. They read stores, create view models, translate copy, and pass props down.
- `src/features/*/viewModels/*.vm.ts`: screen behavior and derived state.
- `src/features/*/stores/*.store.ts`: MobX state.
- `src/features/*/components/*.component.tsx`: presentational components only.
- `src/services/**/*.service.ts`: auth, video picker, and preprocessing boundaries.
- `src/services/**/*.api.ts`: API client boundaries.
- `src/shared`: theme, i18n, types, and reusable UI.

## Video Analysis

The app lets the user pick any source video. HookScore prepares a 3-5 second opening window in `src/services/video/video-preparation.service.ts`, samples frames in `src/services/video/video-frame-extraction.service.ts`, optionally samples web audio in `src/services/video/video-audio-extraction.service.ts`, and sends the sampled media through the active analyzer client. Raw full-video bytes are not uploaded to the AI provider in the current client-only implementation.

## Settings

Language and theme selection live behind the authenticated Settings screen. Theme defaults to `system`, resolves from the phone appearance setting, and can be overridden to light or dark after login.

## Supabase Auth

The app uses Supabase email/password auth. Supabase persists and refreshes the session; MobX only tracks whether a session exists and the current display name. On native builds the Supabase auth payload is stored through Expo SecureStore, backed by iOS Keychain and Android Keystore. Web builds use the browser storage available to Supabase because browsers do not expose the mobile keychain APIs.

Recommended Supabase project setup:

- Enable the Email provider in `Authentication > Providers`.
- Keep password signups enabled. This app sends `name` as user metadata during registration.
- In `Authentication > URL Configuration`, change Site URL away from Supabase's default `http://localhost:3000`.
- Add local web and native callbacks to Redirect URLs: `http://localhost:8081/**` and `hookscore://auth/callback`.
- For production, keep email confirmation enabled and add the production web URL plus production native scheme to Redirect URLs.
- For local MVP testing, you can temporarily disable email confirmation so registration immediately returns a session.
- Configure a custom SMTP provider before production; Supabase's default email sender is only suitable for testing.

## Supabase Daily Usage

Video analyzer usage is stored in `public.video_analyzer_daily_usage` through the migration in `supabase/migrations`. The app calls `get_current_video_analyzer_usage()` when the video prep screen opens. Counts are grouped by authenticated Supabase user and UTC calendar day.

Analyzer result history is stored in `public.video_analyzer_results`. After each successful analysis, the app calls `record_video_analyzer_result(...)`, which saves the result and increments the daily usage counter in the same database transaction. The History screen reads the authenticated user's saved results through Supabase RLS.

Guest analyzer access uses `public.video_analyzer_guest_usage` and the `get_guest_video_analyzer_usage(...)` / `record_guest_video_analyzer_use(...)` RPCs from the latest migration. It stores only an app-generated device UUID and usage count; guest analyzer results are not persisted in Supabase.
