# qiniu-ime

`qiniu-ime` is a voice input method prototype focused on fast, accurate Chinese text input. The first version includes a Web workspace, an XGo backend, pluggable ASR provider boundaries, personal memory correction, metrics, unit tests, and E2E tests.

## Structure

- `app/web`: React + Vite web workspace.
- `server`: XGo backend and tests.
- `docs/modules`: module design and validation notes.
- `docs/workflows`: repeatable local setup and Git release workflows.
- `qiniu-ime-product-design.md`: product and architecture design.

## Run Locally

Backend:

```powershell
$env:PATH = "$env:USERPROFILE\go\bin;$env:PATH"
Set-Location D:\qiniu\server
xgo run .\cmd\qiniu-ime\main.xgo
```

Web:

```powershell
Set-Location D:\qiniu\app\web
pnpm install
pnpm dev
```

Open:

- Web: http://127.0.0.1:5173
- Backend health: http://127.0.0.1:8787/health

## Test

Backend:

```powershell
$env:PATH = "$env:USERPROFILE\go\bin;$env:PATH"
Set-Location D:\qiniu\server
xgo test ./...
go test "-coverprofile=coverage.out" ./api ./application ./domain ./infrastructure/provider/failing ./infrastructure/provider/mock ./infrastructure/storage
go tool cover "-func=coverage.out"
```

Web:

```powershell
Set-Location D:\qiniu\app\web
pnpm build
pnpm exec vitest run --coverage
pnpm exec playwright test
```

## Git Safety

Do not commit ASR credentials, `.env` files, generated XGo files, coverage output, logs, local databases, or built binaries. See `docs/workflows/git-release.md`.
