# Observability and CI

## Current Observability

Implemented:

- Backend structured log lines for transcript events in `server/api/server.xgo`.
- In-memory metrics endpoint: `GET /api/metrics/summary`.
- Web metrics panel showing latency, session count, and provider error count.

Not implemented yet:

- Persistent logs.
- Prometheus metrics endpoint.
- Grafana dashboard.
- Alert rules and notification channels.
- Log redaction policy in code.

Current metrics can be checked locally:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/metrics/summary | ConvertTo-Json -Depth 8
```

## Current CI

GitHub Actions workflow: `.github/workflows/ci.yml`.

Jobs:

- `backend`: builds XGo from source on Windows, runs XGo tests, generates Go coverage.
- `web`: installs dependencies, runs Next build and Vitest coverage.
- `e2e`: builds XGo from source on Windows, installs Playwright Chromium, starts backend/frontend through Playwright webServer, runs browser E2E.

Note: `go install github.com/goplus/xgo/cmd/xgo@latest` is not used in CI because it does not provide the full local XGo runtime expected by `xgo test` in this project. CI mirrors the Windows source-build workflow.

## Local Commands

Run backend:

```powershell
pnpm dev:server
```

Run web:

```powershell
pnpm dev:web
```

Run all checks:

```powershell
pnpm test:all
```

The local all-check command still expects XGo, Go, Node, pnpm, and Playwright browser dependencies to be installed.

On this Windows machine, `pnpm test:e2e` sets `PW_CHROME_CHANNEL=1` and uses installed Chrome. CI uses Playwright-managed Chromium.
