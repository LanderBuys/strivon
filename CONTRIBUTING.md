# Contributing to Strivon

Thanks for your interest in contributing. Here’s how to get set up and submit changes.

## Setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd strivon
   npm install
   ```

2. **Mobile app** (Expo / React Native)
   - From repo root: `npm run dev:mobile` or `cd apps/mobile && npm start`
   - Typecheck: `cd apps/mobile && npm run typecheck`
   - Tests: `cd apps/mobile && npm run test`
   - Lint: `cd apps/mobile && npm run lint`

3. **Web app** (Next.js)
   - From repo root: `npm run dev:web` or `cd apps/web && npm run dev`
   - Lint: `cd apps/web && npm run lint`
   - Build: `cd apps/web && npm run build`

## Before submitting

- Run the relevant **typecheck** and **tests** for the app you changed.
- Keep commits focused; use clear commit messages.
- For UI changes, test on both light and dark theme when applicable.

## Environment and secrets

- Do **not** commit `.env` or real API keys. Use `apps/mobile/.env.example` as a template.
- Production secrets are set in EAS (see `apps/mobile/EAS_SECRETS_SETUP.md`) and in the host’s env for the web app.

## Project structure

- `apps/mobile/` — Expo React Native app (Expo Router, Firebase, EAS).
- `apps/web/` — Next.js landing and about pages.
- Shared conventions: TypeScript, theme in `constants/theme`, API client in `lib/api/`.

If you have questions, open an issue or reach out to the maintainers.
