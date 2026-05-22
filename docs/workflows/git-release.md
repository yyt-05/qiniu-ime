# Git Release Workflow

This workflow is for publishing `qiniu-ime` to GitHub without leaking local secrets or generated artifacts.

## Repository

- Remote: `https://github.com/yyt-05/qiniu-ime.git`
- Default branch: `main`

## Before Commit

Run these checks from `D:\qiniu`:

```powershell
git status --short
Get-ChildItem -Recurse -Force -File . | Where-Object {
  $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\coverage\\|\\test-results\\|\\playwright-report\\|\\.git\\'
} | Select-String -Pattern 'api[_-]?key','secret','token','password','passwd','BEGIN .*PRIVATE KEY','OPENAI_API_KEY','XFYUN','ALIYUN','TENCENT' -CaseSensitive:$false
```

Expected result: only provider names or documentation examples appear. Real keys must never be committed.

## Must Not Commit

- `.env`, `.env.*`
- cloud ASR credentials, API keys, app IDs, app secrets
- local database files under `server/data`
- generated XGo files named `xgo_autogen*.go`
- coverage output, Playwright test output, Vite `dist`
- built binaries such as `server/qiniu-ime.exe`

## Commit Steps

```powershell
git init
git branch -M main
git remote add origin https://github.com/yyt-05/qiniu-ime.git
git add .
git status --short
git commit -m "feat: implement qiniu-ime prototype"
git push -u origin main
```

If the remote already has commits, pull with rebase first:

```powershell
git pull --rebase origin main
git push -u origin main
```

## Validation Before Push

```powershell
$env:PATH = "$env:USERPROFILE\go\bin;$env:PATH"
Set-Location D:\qiniu\server
xgo test ./...
go test "-coverprofile=coverage.out" ./api ./application ./domain ./infrastructure/provider/failing ./infrastructure/provider/mock ./infrastructure/storage
go tool cover "-func=coverage.out"

Set-Location D:\qiniu\app\web
pnpm build
pnpm exec vitest run --coverage
pnpm exec playwright test
```
