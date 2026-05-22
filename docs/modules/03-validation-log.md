# Validation Log

This file is updated as implementation gates pass.

## Environment

- Node: 20.20.0
- pnpm: 9.15.9
- XGo: `xgo v0.0.0-20260521060424-0812361cbcab windows/amd64`
- XGo Windows setup: source build succeeded; non-admin symlink failed; copied `xgo.exe`/`gop.exe` to `%USERPROFILE%\go\bin`.

## Backend

- Build: passed, `server/qiniu-ime.exe`.
- Unit tests: passed, `xgo test ./...`.
- Coverage: passed, explicit package set; total 84.5%.
- WebSocket chain: passed through Playwright E2E with XGo backend.
- Fail-fast provider behavior: passed; `xfyun` emits visible provider error and does not fallback silently.

## Web

- Build: passed, `pnpm build`.
- Unit tests: passed, 5 tests.
- Coverage: passed, statements/lines 96.44%, functions 88.88%, branches 78.48%.
- E2E: passed, 3 Playwright tests using installed Chrome channel.
  - UI renders.
  - Mock ASR chain returns corrected text through XGo backend.
  - Provider failure is visible and does not fallback silently.

## Notes

- Playwright browser download failed due TLS reset, so E2E uses installed Chrome via `channel: "chrome"`.
- Current ASR runtime uses `mock` Provider for local validation; cloud/local ASR providers are explicit fail-fast stubs until configured.
