# qiniu-ime

qiniu-ime 是一个语音输入法原型，目标是提高中文文本输入效率：边说边出字，自动修正常见专有名词，保留可控的输入后处理，并通过测试和指标证明链路真的可用。

当前版本不是完整系统输入法，而是一个可演示、可验收的 Web 工作台 + XGo 后端。Web 用来体验输入流程，XGo 后端负责 ASR Provider 抽象、个人记忆、后处理、评测和指标。

## 目前实现了什么

- Web 输入工作台：Provider、场景、后处理模式、实时文本、原始 ASR、修正结果、记忆命中、指标展示。
- XGo 后端：`/health`、`/ws/asr`、`/api/memory`、`/api/sessions/{id}/accept`、`/api/eval/report`、`/api/metrics/summary`。
- 可替换 ASR 架构：本地演示用 `mock` Provider，云厂商和本地 ASR Provider 先做显式报错，不静默兜底。
- 个人记忆：例如把“扣豆”修正为 `Kodo`，并展示命中的规则。
- 测试：后端单测、前端单测、覆盖率、Playwright E2E。

## 怎么体验

先启动后端：

```powershell
$env:PATH = "$env:USERPROFILE\go\bin;$env:PATH"
Set-Location D:\qiniu\server
xgo run .\cmd\qiniu-ime\main.xgo
```

再启动 Web：

```powershell
Set-Location D:\qiniu\app\web
pnpm install
pnpm dev
```

打开：

- Web 工作台：http://127.0.0.1:5173
- 后端健康检查：http://127.0.0.1:8787/health

推荐体验路径：

1. Provider 保持 `mock`。
2. 演示输入填入“我们用扣豆上传文件”。
3. 点击“开始”，文本区会先显示 partial。
4. 点击“停止”，最终结果会变成“我们用 Kodo 上传文件。”。
5. 右侧可以看到“扣豆 -> Kodo”的记忆命中。
6. 点击“确认学习”，后端会记录一次用户确认。
7. 切换 Provider 为 `xfyun` 再点“开始”，会看到明确错误：`provider xfyun is not configured`，证明没有静默 fallback。

## 怎么确认实现了

后端验收：

```powershell
$env:PATH = "$env:USERPROFILE\go\bin;$env:PATH"
Set-Location D:\qiniu\server
xgo test ./...
go test "-coverprofile=coverage.out" ./api ./application ./domain ./infrastructure/provider/failing ./infrastructure/provider/mock ./infrastructure/storage
go tool cover "-func=coverage.out"
```

前端验收：

```powershell
Set-Location D:\qiniu\app\web
pnpm build
pnpm exec vitest run --coverage
pnpm exec playwright test
```

已验证结果见：[docs/modules/03-validation-log.md](docs/modules/03-validation-log.md)。

## 项目结构

- `app/web`：React + Vite Web 工作台。
- `server`：XGo 后端和测试。
- `docs/product-design.md`：总设计文档。
- `docs/modules`：模块设计和验收记录。
- `docs/workflows`：Windows/XGo/Git 操作经验。

## Git 和敏感信息

不要提交 ASR 密钥、`.env`、XGo 生成文件、覆盖率、日志、本地数据库、构建产物。Git 发布流程见：[docs/workflows/git-release.md](docs/workflows/git-release.md)。
