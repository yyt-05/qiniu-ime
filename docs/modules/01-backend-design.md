# Backend Module Design

## Language

The backend is fixed to XGo. There is no Go fallback implementation.

## Layers

- `domain`: pure core rules and models.
- `ports`: provider/storage/metrics interfaces.
- `application`: session orchestration.
- `infrastructure`: ASR providers and in-memory storage.
- `api`: HTTP and WebSocket protocol.

## Provider Policy

Provider selection is explicit. If a configured provider fails, the session fails and emits a structured error. No silent fallback is allowed.

The `mock` provider exists only for local validation and E2E.

## Runtime Endpoints

- `GET /health`
- `GET /api/memory`
- `POST /api/memory/terms`
- `POST /api/sessions/{id}/accept`
- `POST /api/eval/report`
- `GET /api/metrics/summary`
- `WS /ws/asr`

