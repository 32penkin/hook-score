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

Development values live in `.env.development.local`; production values live in `.env.production.local`. Both files are ignored by git through the existing `.env*.local` rule.

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

Public legal pages live outside the app in the repository-level `docs/` folder and deploy to GitHub Pages. The mobile bundle defaults to the GitHub Pages URLs, but production builds can override them:

```sh
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://32penkin.github.io/hook-score/privacy/
EXPO_PUBLIC_ACCOUNT_DELETION_URL=https://32penkin.github.io/hook-score/account-deletion/
EXPO_PUBLIC_ACCOUNT_DELETION_FUNCTION=delete-account
```

The public account deletion page is static HTML with a `mailto:` request link. It does not require a web app, Supabase Function, or signed-in session for users who cannot access their account.

Video analysis uses a Supabase Edge Function proxy by default. The app samples image frames from the selected 3-5 second opening window and sends those images plus the user's context to `supabase/functions/analyze-hook`; the function reserves analyzer usage, calls the selected AI provider with server-side secrets, and saves authenticated history without exposing provider API keys in the mobile bundle. On web builds with Gemini, HookScore also extracts a tiny mono WAV sample from the same opening window and sends it with the frame request so the analyzer can judge speech, music, silence, and audio-visual fit.

```sh
EXPO_PUBLIC_AI_PROVIDER=gemini
EXPO_PUBLIC_AI_TRANSPORT=supabase
EXPO_PUBLIC_SUPABASE_ANALYZE_HOOK_FUNCTION=analyze-hook
```

Set provider secrets in Supabase, not in Expo env files:

```sh
supabase secrets set GEMINI_API_KEY=...
supabase secrets set GEMINI_MODEL=gemini-2.5-flash-lite
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set OPENAI_MODEL=gpt-5.4-mini
supabase functions deploy analyze-hook
supabase functions deploy delete-account
```

Use `gemini-2.5-flash` instead when you need a stronger quality pass for visual or audio analysis. You can also restrict the deployed function to one provider:

```sh
supabase secrets set AI_ALLOWED_PROVIDERS=gemini
```

OpenAI is also available:

```sh
EXPO_PUBLIC_AI_PROVIDER=openai
```

Direct client-side provider calls are still available only as an explicit local fallback:

```sh
EXPO_PUBLIC_AI_TRANSPORT=direct
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
```

Do not use direct transport for production builds.

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

The app lets the user pick any source video. HookScore prepares a 3-5 second opening window in `src/services/video/video-preparation.service.ts`, samples frames in `src/services/video/video-frame-extraction.service.ts`, optionally samples web audio in `src/services/video/video-audio-extraction.service.ts`, and sends the sampled media through the active analyzer client. Raw full-video bytes are not uploaded to the AI provider.

## Settings

Language, theme selection, history, logout, and account deletion requests live behind the authenticated Settings screen. Theme defaults to `system`, resolves from the phone appearance setting, and can be overridden to light or dark after login.

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

Analyzer result history is stored in `public.video_analyzer_results`. In Supabase transport, the Edge Function calls `record_video_analyzer_use()` before provider inference and then `record_reserved_video_analyzer_result(...)` after a successful authenticated result, so provider calls are rate-limited server-side without double-counting. In direct local transport, the app still calls `record_video_analyzer_result(...)`, which saves the result and increments the daily usage counter in the same database transaction. The History screen reads the authenticated user's saved results through Supabase RLS.

Guest analyzer access uses `public.video_analyzer_guest_usage` and the `get_guest_video_analyzer_usage(...)` / `record_guest_video_analyzer_use(...)` RPCs from the latest migration. It stores only an app-generated device UUID and usage count; guest analyzer results are not persisted in Supabase.

## Supabase Account Deletion Requests

Account deletion requests are stored in `public.account_deletion_requests` through the latest migration. The Settings screen calls the `delete-account` Edge Function for authenticated users. The function verifies the user's JWT, records a deletion request, deletes the Supabase Auth user with `SUPABASE_SERVICE_ROLE_KEY`, then marks the request `completed`. Account-linked app data is removed by the existing `on delete cascade` foreign keys.

The `request_account_deletion()` RPC remains available for manual fallback requests from users who cannot sign in and use the public deletion request page.
