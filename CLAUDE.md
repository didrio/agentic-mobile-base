@AGENTS.md

## Claude Code specifics

- Project skills (`/new-app`, `/add-feature`, `/add-native-capability`, `/run-app`, `/release`) live in
  `.claude/skills/`. The Expo plugin adds Expo/EAS skills and the Expo MCP server (docs search, EAS builds,
  workflows, submissions; run `/mcp` once to authenticate).
- A PostToolUse hook runs Prettier on every file you write or edit, so don't spend turns on formatting.
- Read screenshots from `npm run screenshot` with the Read tool — that's how you see the app.
- Run `npm start` / `npm run ios` / `npm run android` in the background; they're long-lived.
- Permissions: routine checks are pre-allowed in `.claude/settings.json`; release/submit/production-update
  commands always ask.
