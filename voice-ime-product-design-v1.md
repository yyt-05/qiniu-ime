# 语音输入法产品设计 V1

> 题目：开发一个语音输入法产品，帮助用户提高文本输入效率。  
> 产品代号：声写 FlowKey。  
> 核心判断：不要做一个“功能最多的输入法”，而是做一个“长文本语音输入体验最稳、可验证、可扩展”的输入法。

## 0. 方法论对齐

这题不要从“AI 可以写代码，所以先堆功能”开始，而要从产品架构师视角拆：

- 产品做减法：MVP 只保留一个核心规格：按住/点击说话 -> 实时出字 -> 自动标点/纠错 -> 一键提交到当前输入框。
- 架构做乘法：输入法壳、音频处理、ASR 网关、文本后处理、用户词库、评测平台彼此独立。未来换 ASR 供应商、换端、换模型，不重写产品。
- 测试是必选项：用固定音频集、接口契约测试、端到端输入测试证明“准、快、稳、省”，而不是只证明“能跑”。

参考项目 `cffa-as/3d-model-generator-app` 的可学习点：它的亮点不是单个页面，而是完整闭环：README 可运行、AI API 接入、任务状态、缓存、用户/管理后台、评分评估、测试脚本、架构文档。语音输入法也要做成“体验闭环 + 工程闭环 + 评测闭环”。

## 1. 用户需求收集与分析

### 1.1 目标用户

| 用户 | 高频场景 | 当前痛点 | 产品机会 |
|---|---|---|---|
| 移动端重度聊天用户 | 微信、QQ、飞书、评论区 | 语音消息不方便阅读；键盘打长句慢 | 快速说话变文字，即说即发 |
| 办公/知识工作者 | 邮件、日报、会议纪要、Prompt | 口语转文字后还要手动整理 | 语音输入后自动标点、去口头禅、转书面表达 |
| 内容创作者 | 小红书、公众号、短视频脚本 | 灵感流失，键盘跟不上表达 | 长段连续听写 + 结构化整理 |
| 方言/普通话不标准用户 | 日常聊天、长辈输入 | 普通输入法识别不稳 | 方言模式、个人热词、纠错学习 |
| 无障碍用户 | 手部不便、临时不便打字 | 系统听写不够可控 | 大按钮、低操作成本、撤回/重说明确 |

### 1.2 需求结论

用户真正要的不是“语音识别技术”，而是“低成本把脑子里的话放到任何输入框里”。核心指标是：

- 准确度：普通话安静环境 CER <= 8%，常用办公词/人名/项目名可通过词库降低错误。
- 响应速度：首个中间结果 P50 <= 800ms；停顿后最终文本 P50 <= 1200ms。
- 易用性：不要求用户理解模型、采样率、接口；默认点击说话即可。
- 成本：每次会话记录音频时长、供应商、费用估算；低价值场景走便宜供应商，高价值场景走高准确供应商。
- 隐私：默认不保存原始音频；用户明确打开“帮助改进识别”后才上传脱敏样本。

## 2. 产品设计定位

### 2.1 一句话定位

面向移动与桌面长文本输入的隐私优先语音输入法，重点解决“说得快、识别准、改得少、能直接进输入框”。

### 2.2 产品边界

MVP 做：

- Android 真实输入法：基于 `InputMethodService`，可在任意输入框输入。
- 桌面轻量输入助手：Windows 先做全局快捷键 + 粘贴到当前焦点窗口；正式 Windows IME 作为 V2。
- Web 管理台：词库、历史文本、评测样本、成本和错误统计。
- ASR 网关：可插拔接入讯飞、阿里云、腾讯云、OpenAI 或本地 FunASR/whisper.cpp。

MVP 不做：

- 不做皮肤商店、表情包、斗图、社交社区。
- 不做通话录音、会议全量转写平台。
- 不做“万能 AI 助手”入口，只保留输入相关的润色、纠错、格式化。

### 2.3 同类产品分析

| 产品/能力 | 优势 | 不足 | 我们的差异化 |
|---|---|---|---|
| 讯飞输入法/讯飞 ASR | 中文语音与方言识别强，实时转写生态成熟 | 对开发者来说依赖云端与费用；输入法体验难差异化 | 作为可插拔高准确供应商之一，不绑定唯一引擎 |
| 百度输入法 | 输入方式完整，有语音优化和用户词库能力 | 产品功能多，容易偏泛输入法 | 聚焦长文本语音输入和可验证评测 |
| 微信输入法 | 社交输入场景强，语音转文字路径短 | 生态强绑定微信，开放性有限 | 做跨 App、跨端、可私有部署的语音输入 |
| Gboard/系统听写 | 系统级体验好，操作成本低 | 中文领域、专有词、企业词库可控性有限 | 提供个人/团队词库、术语热词和后处理 |
| 讯飞听见/会议转写类 | 长音频、会议纪要强 | 不是输入法，不能自然进入任意输入框 | 输入法级低摩擦，而不是录音转写工具 |
| 本地模型 FunASR/whisper.cpp | 成本和隐私优势明显 | 端侧性能、功耗、准确率和实时性受限 | 作为隐私模式/离线模式，而非默认唯一方案 |

定位结论：不要正面挑战讯飞/百度的全量输入法生态，选择“语音输入体验 + 工程可验证 + 供应商可切换”作为参赛亮点。

## 3. 方案设计

### 3.1 总体架构

```text
Android IME / Windows Helper / Web Demo
        |
        | WebSocket: PCM/Opus audio chunks, partial/final transcript
        v
ASR Gateway API
        |
        +-- VAD / noise gate / audio format normalization
        +-- Provider Router: xfyun / aliyun / tencent / openai / local-funasr
        +-- Text Post-Processor: punctuation, number/date normalization, filler removal
        +-- Personal Dictionary: names, project terms, hot words
        +-- Feedback Collector: correction pairs, latency, cost, error type
        |
        v
PostgreSQL/MySQL + Redis + Object Storage(optional)
        |
        v
Admin & Evaluation Console
```

### 3.2 API 先行

#### WebSocket：实时识别

`wss://api.flowkey.dev/v1/asr/sessions/{session_id}/stream`

客户端事件：

```json
{"type":"session.start","language":"zh-CN","mode":"dictation","scene":"chat","sample_rate":16000,"format":"pcm16","dictionary_ids":["default","work"]}
{"type":"audio.chunk","seq":1,"audio":"<base64 pcm bytes>"}
{"type":"audio.end","reason":"user_stop"}
{"type":"transcript.accept","segment_id":"seg_001","text":"今天下午三点同步一下接口文档。"}
{"type":"transcript.reject","segment_id":"seg_001","reason":"wrong_text","correct_text":"今天下午三点同步一下 API 文档。"}
```

服务端事件：

```json
{"type":"session.ready","session_id":"asr_123","provider":"xfyun","trace_id":"tr_001"}
{"type":"transcript.partial","segment_id":"seg_001","seq":8,"text":"今天下午三点同步一下","stability":0.72}
{"type":"transcript.final","segment_id":"seg_001","text":"今天下午三点同步一下 API 文档。","confidence":0.91,"latency_ms":980}
{"type":"usage.update","audio_ms":5200,"estimated_cost":0.0042}
{"type":"error","code":"PROVIDER_TIMEOUT","message":"ASR provider timeout, switched to backup provider"}
```

#### REST：业务接口

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/v1/asr/sessions` | 创建识别会话，返回 `session_id` 和供应商路由 |
| `GET` | `/v1/asr/sessions/{id}` | 查询会话状态、延迟、成本、最终文本 |
| `POST` | `/v1/text/polish` | 口语转书面语、去口头禅、改格式 |
| `POST` | `/v1/dictionaries` | 创建个人/团队词库 |
| `POST` | `/v1/dictionaries/{id}/terms` | 新增热词、人名、项目名 |
| `POST` | `/v1/feedback/corrections` | 上报用户纠错，用于回归样本 |
| `GET` | `/v1/metrics/summary` | 管理台指标：准确率、延迟、成本、错误分布 |
| `POST` | `/v1/evals/runs` | 用固定音频集跑一次评测 |

### 3.3 ASR Provider 接口

后端内部统一接口：

```go
type ASRProvider interface {
    Name() string
    Start(ctx context.Context, cfg SessionConfig) (Stream, error)
    EstimateCost(audioMs int64, cfg SessionConfig) decimal.Decimal
    Capabilities() Capabilities
}

type Stream interface {
    SendAudio(seq int64, pcm []byte) error
    Recv() (TranscriptEvent, error)
    Close(reason string) error
}
```

路由策略：

- 默认中文聊天：低延迟低成本供应商。
- 办公/专业词库：高准确供应商 + 用户词库提示。
- 隐私模式：本地模型或私有化 FunASR。
- 供应商超时：自动切备用，同时记录降级事件。

## 4. 功能设计

### 4.1 输入法端

Android 端：

- `InputMethodService` 创建键盘面板。
- 主操作只有 3 个：语音键、撤回键、键盘/语音切换键。
- 中间结果显示在候选栏；最终结果通过 `InputConnection.commitText()` 写入当前输入框。
- 密码/验证码字段禁用语音上传和历史记录。

Windows MVP：

- 全局快捷键开始/停止录音。
- 浮窗显示实时文字。
- 停止后写入剪贴板并粘贴到当前焦点窗口。
- V2 走 TSF 正式 IME；Windows 第三方 IME 需要 TSF aware 和数字签名，工程量更大。

### 4.2 文本后处理

- 自动标点：根据停顿、语义和句长补逗号/句号/问号。
- 口语清理：去除“嗯、啊、那个、然后然后”等。
- 格式化模板：聊天、邮件、日报、Prompt 四种模式。
- 术语修正：把“七牛 kodo”“扣豆”纠正为用户词库中的 `Qiniu Kodo`。

### 4.3 评测与管理台

- 识别质量：CER/WER、标点 F1、热词命中率。
- 体验质量：首字延迟、最终延迟、会话失败率。
- 成本质量：每分钟成本、每 1000 字成本、供应商占比。
- 回归样本：用户纠错后生成 `audio + expected text + scene + provider`，进入固定评测集。

## 5. 实现建议

### 5.1 技术选型结论

推荐主线：

- Android：Kotlin + Jetpack + `InputMethodService`。
- Web 管理台：Next.js + TypeScript + shadcn/ui。
- 后端：Go，优先 `chi`/`gin` + WebSocket + PostgreSQL/MySQL + Redis。
- 音频/本地推理：Rust 或 C++，用于 VAD、Opus、whisper.cpp/FunASR adapter，不作为业务 API 主语言。
- 评测脚本：Python，方便计算 CER/WER、批量跑音频样本。

Go/Rust/XGo 判断：

- Go：最适合 MVP 后端主线。WebSocket 并发、SDK 封装、部署、团队学习成本都比较均衡。
- Rust：适合做高性能音频模块、端侧库、WASM、本地模型 glue code；用 Rust 写完整业务后端会拖慢第一版。
- XGo：适合学习“AI 原生工程语言”和做教学/原型展示；若比赛希望体现 XEngineer 思想，可以用 XGo 写一个小型规则/评测 DSL 或 demo，但主线服务先用 Go 更稳。

### 5.2 数据库核心表

```sql
users(id, email, phone, created_at)
devices(id, user_id, platform, app_version, last_seen_at)
asr_sessions(id, user_id, device_id, scene, provider, status, audio_ms, cost, created_at)
transcript_segments(id, session_id, start_ms, end_ms, text, confidence, is_final)
dictionaries(id, owner_id, scope, name, created_at)
dictionary_terms(id, dictionary_id, term, aliases, weight, enabled)
corrections(id, session_id, segment_id, original_text, corrected_text, error_type, created_at)
eval_samples(id, scene, audio_url, expected_text, tags, consent_status)
eval_runs(id, provider, model, cer, wer, p50_latency_ms, p95_latency_ms, cost_per_hour, created_at)
provider_usage(id, provider, date, audio_ms, cost, error_count)
```

音频默认不入库；只有用户同意进入改进计划，才上传脱敏音频到对象存储，并设置生命周期策略。

## 6. 测试方案

### 6.1 单元测试

- 音频切片：静音、短句、连续长句、网络重传。
- VAD：噪声、停顿、误触发。
- 文本后处理：标点、数字日期、人名、热词、英文缩写。
- Provider adapter：用 mock WebSocket 覆盖超时、断线、乱序、重复包。
- 费用计算：不同供应商、不同音频时长、不同套餐。

目标：后端核心包覆盖率 >= 90%，文本后处理覆盖率 >= 95%。

### 6.2 契约测试

- WebSocket 事件 JSON schema 固定。
- 每个 Provider adapter 必须通过同一组 contract tests。
- 前后端共用 OpenAPI/AsyncAPI 文档生成类型。

### 6.3 E2E 测试

- Android instrumentation：打开测试输入框 -> 点击语音 -> 播放固定音频 -> 检查文本是否写入。
- Windows helper：启动浮窗 -> 模拟音频 -> 检查剪贴板/目标输入框内容。
- Web 管理台：Playwright 覆盖词库管理、评测运行、指标看板。

### 6.4 回归评测

固定评测集：

- 50 条安静普通话短句。
- 50 条办公长句。
- 50 条带人名/项目名/英文缩写。
- 30 条轻噪声。
- 30 条方言或口音。

每次发版输出：

- CER/WER。
- 标点 F1。
- 热词命中率。
- 首字延迟 P50/P95。
- 最终延迟 P50/P95。
- 每小时音频成本。

发版门禁：

- CER 相比上一版恶化超过 1% 阻断。
- P95 最终延迟超过 2500ms 阻断。
- WebSocket 会话失败率超过 1% 阻断。

## 7. 上线方案

### 7.1 CI/CD

Windows 本地开发命令优先：

```powershell
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
pnpm test
pnpm exec playwright test
```

流水线：

- PR：lint + unit + contract + coverage。
- main：构建 Docker 镜像，生成 OpenAPI/AsyncAPI 文档。
- release：跑固定音频评测集，输出评测报告。
- 灰度：按用户比例开启供应商路由策略。

### 7.2 部署

- API Gateway：HTTPS/WSS。
- ASR Gateway：水平扩容，无状态。
- Redis：会话状态、短期 partial transcript。
- PostgreSQL/MySQL：用户、词库、反馈、评测指标。
- Object Storage：可选保存用户授权的评测音频。
- Observability：OpenTelemetry + Prometheus + Grafana + Sentry。

### 7.3 隐私与合规

- 默认不保存原始音频。
- 密码/验证码/银行卡输入框禁用云端语音。
- 音频上传前弹出明确授权。
- 管理台只展示脱敏文本。
- API key 存储在服务端密钥管理，不下发到客户端。

## 8. 里程碑

### P0：2 周，可演示闭环

- Android IME 原型。
- Go ASR Gateway，接入 1 个云 ASR + 1 个 mock provider。
- 实时 partial/final 文本。
- 用户词库最小版本。
- 30 条固定音频评测。

### P1：4 周，参赛可展示

- Web 管理台。
- 文本后处理。
- 供应商路由和备用切换。
- 纠错反馈闭环。
- 覆盖率报告和回归评测报告。

### P2：6-8 周，接近可上线

- Windows helper。
- 本地/私有化 ASR adapter。
- 成本看板。
- 灰度发布和异常告警。
- 隐私授权与样本生命周期。

## 9. 第一版项目结构

```text
voice-ime/
├── apps/
│   ├── android-ime/          # Kotlin InputMethodService
│   ├── windows-helper/       # Tauri/Rust or Go helper
│   └── web-console/          # Next.js admin/eval console
├── services/
│   ├── asr-gateway/          # Go WebSocket + REST API
│   ├── text-processor/       # Go/Rust text normalization
│   └── eval-runner/          # Python evaluation scripts
├── packages/
│   ├── contracts/            # OpenAPI, AsyncAPI, JSON schemas
│   └── test-fixtures/        # audio fixtures and expected text
├── deploy/
│   ├── docker-compose.yml
│   └── k8s/
└── docs/
    ├── architecture.md
    ├── api.md
    ├── testing.md
    └── privacy.md
```

## 10. 风险与取舍

- 真正系统级输入法比普通 App 难，Android 先行是为了尽快形成真实输入闭环。
- Windows TSF 正式 IME 工程成本高，MVP 用 helper 证明价值，V2 再做系统级 IME。
- 单一 ASR 供应商风险高，必须从第一版就设计 provider adapter。
- 评测集比模型选择更重要。没有固定样本，就无法证明“更准、更快、更省”。
- 语音输入涉及隐私，默认不存音频是产品信任底线。

## 11. 资料来源

- 参考项目：[cffa-as/3d-model-generator-app](https://github.com/cffa-as/3d-model-generator-app)
- Android 输入法官方文档：[Create an input method](https://developer.android.google.cn/develop/ui/views/touch-and-input/creating-input-method?hl=en)、[`InputMethodService`](https://developer.android.com/reference/android/inputmethodservice/InputMethodService)
- Windows IME/TSF 官方文档：[Input Method Editors](https://learn.microsoft.com/en-us/windows/apps/develop/input/input-method-editors)、[Text Services Framework](https://learn.microsoft.com/windows/desktop/TSF/text-services-framework)
- 讯飞实时语音转写：[讯飞开放平台 RTASR](https://www.xfyun.cn/doc/asr/rtasr/API.html)
- 阿里云实时语音识别：[WebSocket 实时语音识别](https://help.aliyun.com/zh/isi/developer-reference/websocket)、[计费说明](https://help.aliyun.com/zh/isi/product-overview/billing-10)
- 腾讯云语音识别：[产品页](https://cloud.tencent.com/product/asr?Is=sdk-topnav)
- OpenAI 语音转文本：[Speech to text](https://platform.openai.com/docs/guides/speech-to-text?lang=curl)、[Realtime transcription](https://platform.openai.com/docs/guides/realtime-transcription)
- 本地/开源 ASR：[FunASR](https://github.com/modelscope/FunASR)、[whisper.cpp](https://github.com/ggml-org/whisper.cpp)
- XGo：[goplus/xgo](https://github.com/goplus/xgo)
- 语音输入效率研究：[Comparing Speech and Keyboard Text Entry](https://arxiv.org/abs/1608.07323)
