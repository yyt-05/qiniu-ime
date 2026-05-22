# Validation Log

This file is updated as implementation gates pass.

## Environment

- Node: 20.20.0
- pnpm: 9.15.9
- XGo: `xgo v0.0.0-20260521060424-0812361cbcab windows/amd64`
- Python: 3.12 for local faster-whisper sidecar
- XGo Windows setup: source build succeeded; non-admin symlink failed; copied `xgo.exe`/`gop.exe` to `%USERPROFILE%\go\bin`.

## Backend

- Build: passed, `server/qiniu-ime.exe`.
- Unit tests: passed, `xgo test ./...`.
- Coverage: passed, explicit package set; total 84.6%.
- WebSocket chain: passed through Playwright E2E with XGo backend.
- Fail-fast provider behavior: passed; `xfyun` emits visible provider error and does not fallback silently.
- Local ASR provider boundary: passed through E2E with explicit fixture text and through provider unit tests; faster-whisper import verified.

## Web

- Build: passed, `pnpm build` with Next.js.
- Unit tests: passed, 5 tests.
- Coverage: passed, statements/lines 87.31%, functions 80.00%, branches 76.92%.
- E2E: passed, 5 Playwright tests using installed Chrome channel.
  - UI renders.
  - Mock ASR chain returns corrected text through XGo backend.
  - Browser microphone mode sends MediaRecorder audio chunks through WebSocket.
  - Local provider chain returns corrected text through XGo provider boundary.
  - Provider failure is visible and does not fallback silently.

## Notes

- Playwright browser download failed due TLS reset, so E2E uses installed Chrome via `channel: "chrome"`.
- Current ASR runtime uses `mock` Provider for local validation; cloud/local ASR providers are explicit fail-fast stubs until configured.
