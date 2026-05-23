# Git Release Workflow

This workflow is for publishing `qiniu-ime` to GitHub without leaking local secrets or generated artifacts.

## Repository

- Remote: `https://github.com/yyt-05/qiniu-ime.git`
- Stable branch: `main`
- Development branch: `develop`

## Branch Model

- `main` is the stable demo/release branch. It must always be runnable and reproducible.
- `develop` is the integration branch for day-to-day work.
- Feature branches must start from `develop`.
- Pull requests for normal development should target `develop`.
- `main` should only receive release/demo-ready changes from `develop`.

Recommended branch naming:

```text
feat/<short-feature>
fix/<short-bug>
docs/<short-doc-change>
ci/<short-ci-change>
```

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
git switch -c develop
git remote add origin https://github.com/yyt-05/qiniu-ime.git
git add .
git status --short
git commit -m "feat: implement qiniu-ime prototype"
git push -u origin develop
```

If the remote already has commits, pull with rebase first:

```powershell
git fetch origin
git switch develop
git pull --rebase origin develop
git push -u origin develop
```

## Pull Request Rules

Every PR must be small and single-purpose:

- One PR implements or changes one feature, fix, workflow, or documentation concern.
- Split large features into multiple independent PRs.
- Do not mix unrelated refactors, formatting churn, generated files, local logs, build output, coverage output, or credentials.
- After merge, `develop` must stay runnable. `main` must stay demo/release-ready.

PR title:

- One clear sentence describing what changed.
- Avoid vague titles such as `update`, `optimize`, or `fix stuff`.

PR description:

```markdown
## 功能描述

说明本 PR 新增/修改了什么、解决什么问题、用户或评委如何使用。

## 实现思路

说明核心技术选择、主要模块、关键边界。

## 测试方式

- `command`: result

## 风险与后续

说明未覆盖边界、上线注意事项、后续 PR 继续处理什么。没有明显风险则写“暂无已知风险”。
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
