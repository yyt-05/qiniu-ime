# Web Workspace Design

The Web workspace is the fastest validation surface. It is not the final IME, but it must use the same backend WebSocket protocol as Android.

## Responsibilities

- Show provider and postprocess controls.
- Open `/ws/asr` and send `session.start`, `audio.chunk`, `audio.end`.
- Render partial/final transcript events.
- Render applied memory rules and latency.
- Submit accepted text for learning.
- Show health/metrics status.

## Non-goals

- No provider SDK in the browser.
- No duplicated hotword correction rules in frontend.
- No silent local fallback when backend fails.

