# qiniu-ime：24 小时 AI 辅助版语音输入法产品设计

> 目标：不是做“又一个大而全输入法”，而是在 24 小时 AI 辅助开发内做出一个有竞争力、可上线演示、能证明输入效率提升的语音输入法产品。  
> 一句话：qiniu-ime 是一个高准确率、低延迟、可纠错学习的语音输入法，主打“说完就能发，少改字”。

## 1. 产品判断

这题最贴切实际的需求只有一个：**提高文本输入效率**。  
输入效率不是按钮多，而是这条链路短：

```text
开始说话 -> 实时看到文字 -> 系统自动修正 -> 用户少量确认 -> 写入输入框
```

所以产品不做皮肤、社区、表情包、复杂账号体系。24 小时版只围绕三件事加深：

1. 识别准：用成熟中文 ASR + 热词纠错 + 自动标点，减少重复说。
2. 出字快：流式识别，边说边出字，不等整段录完。
3. 能证明：显示准确率、首字延迟、最终延迟、用户修改次数。

## 2. 产品定位

项目名：**qiniu-ime**。

产品形态：一个面向中文长文本输入的语音输入法原型，当前先用 Web 工作台验证核心链路，后续可扩展到 Android IME、桌面助手或浏览器插件。

产品标语：**说得自然，写得准确。**

## 3. 目标用户和场景

只选一个主场景：**移动办公和聊天中的长文本输入**。

典型用户：学生、实习生、工程师、运营、销售，需要在微信、飞书、邮件、日报、AI Prompt 里快速输入 50 到 300 字。

痛点：

- 键盘打长段慢。
- 语音消息对接收方不友好。
- 普通语音输入识别错了还要重复说。
- 专有名词、人名、英文缩写容易错。

qiniu-ime 的竞争点：**把“识别错误后的返工成本”降下来**。

## 4. 调研结论

已经做过一轮面向 24 小时开发的可行性调研，结论如下：

| 调研项 | 结论 | 对产品方案的影响 |
|---|---|---|
| 竞品方向 | 讯飞、百度、微信输入法都在做语音输入，单纯“能语音转文字”没有差异 | qiniu-ime 不拼大而全，主打长文本输入的准确率、速度和纠错闭环 |
| ASR 能力 | 中文实时语音识别应优先选成熟 ASR，但不能绑定单一厂商 | 本地演示用 `mock` Provider 稳定跑通闭环，同时用 `local` Provider 接入 faster-whisper 验证真实麦克风入口 |
| 输入效率 | 用户真正痛点不是识别一次，而是错了以后要重复说、重复改 | 加热词纠错、撤回、原文/修正文对比、修改次数指标 |
| 速度链路 | 文件上传式 ASR 会慢，流式 WebSocket 能边说边出字 | 音频按小帧发送，partial 实时显示，final 到达后局部替换 |
| 部署方式 | 部署是最后一环，不应该反推代码架构 | 先按可维护产品架构设计后端；Vercel 可只部署前端，后端用容器/云服务器承载长连接 |
| XGo 后端 | 题目和公司语境都适合直接用 XGo；不要写 Go 备选和兼容兜底 | 后端固定 XGo，问题直接暴露，靠测试和日志定位，而不是静默 fallback |

市面产品参考：

| 产品 | 可借鉴点 | 对 qiniu-ime 的启发 |
|---|---|---|
| Gboard Advanced Voice Typing | 支持自动标点开关、语音编辑命令；会基于用户修正做个性化改进，且可关闭个性化 | qiniu-ime 要把“自动处理”和“个性化学习”做成可控开关 |
| 百度输入法 | 有用户词库、通讯录词库、词频调整、网络用户词同步，并提供“语音自动优化”设置 | 人名和专有名词是输入法记忆的刚需，不是锦上添花 |
| Wispr Flow | 语音输入后做 AI auto-edits、个人词典、按应用调整语气 | qiniu-ime 可以用“场景模式”控制是否润色、是否清除口头禅 |
| Superwhisper | 提供纯转写、文本格式化、自定义模式和自定义 AI 指令 | qiniu-ime 不应只有一种后处理，应允许原文、轻整理、逻辑修正 |
| Notta Verbatim | 区分 full verbatim 和 clean verbatim；前者保留 filler、stutter、false start，后者清理这些内容 | “保留语气词”和“清理口头禅”都合理，关键是让用户选 |
| Dragon | 会把用户常用词和短语加入个人 profile 的 vocabulary | qiniu-ime 的记忆先从词汇/短语学习做起，不做复杂声学训练 |

## 5. 24 小时 AI 辅助开发形态

如果 AI 可以全天跑，范围可以比普通一天 Hackathon 更大，但仍然不能发散。交付物定为“可上线、可演示、可评测、可讲工程判断”的 qiniu-ime：

必须完成：

- Web/PWA 输入法工作台，使用 Next.js + Tailwind，可部署到 Vercel、静态站点或任意前端托管。
- qiniu-ime XGo 后端服务：提供 ASR Gateway、用户记忆、热词纠错、评测报告。
- ASR Provider 插件化：本地演示先使用 `mock` Provider 跑通闭环；真实接入时可替换为讯飞、阿里云、腾讯云、OpenAI、本地 FunASR/whisper.cpp。
- 热词纠错：支持七牛云、Kodo、XGo、Vercel、人名、项目名。
- 自动标点、口头禅清理、数字/英文缩写修正。
- 个人记忆：记录用户确认过的纠错，后续自动优先识别和修正。
- 后处理模式：原声、轻整理、清爽、逻辑修正四档可选。
- 纠错前后对比：展示原始 ASR、qiniu-ime 修正后文本、用户最终确认文本。
- 指标看板：首字延迟、最终延迟、CER、热词命中率、用户修改次数。
- 固定样本评测：至少 20 条测试句，生成 `docs/test-report.md`。
- XGo 后端核心：把 ASR Gateway、热词纠错、个人记忆、评测逻辑做成可复用模块。
- 单测 + E2E：核心算法覆盖率尽量到 90%，Playwright 覆盖主流程。

冲刺加分项：

- Android `InputMethodService` 最小壳：直接连接 qiniu-ime 后端协议，证明产品可变成系统输入法。
- 历史记录与词库持久化：24 小时版可用 SQLite/PostgreSQL，部署时再选择 Supabase、Neon、Upstash 等托管服务。
- 场景模式：聊天、日报、邮件、Prompt 四个模式，影响标点/格式化策略。
- 分享式演示链接：评委打开 Vercel 地址就能试。

这不是“少做”，而是把 AI 的产能投入到最有竞争力的闭环上：**准、快、少改、有报告、可上线**。

## 6. 端侧范围

qiniu-ime 不需要一开始做所有端。端越多，适配和测试成本越高，反而会削弱核心能力。

24 小时版只做两个端：

| 端 | 是否做 | 目的 | 边界 |
|---|---|---|---|
| Web/PWA 工作台 | 必做 | 最快演示完整语音输入、记忆、后处理、指标看板 | 不是最终输入法形态，但方便评委体验 |
| Android IME 壳 | 加分项，尽量做 | 证明它能进入真实输入框，是“输入法”而不是普通转写网页 | 只做最小 `InputMethodService`，复用后端 WebSocket 协议 |
| iOS Keyboard | 不做 | 第三方键盘权限、网络和录音限制更麻烦 | 放到后续版本 |
| Windows/macOS IME | 不做 | TSF/InputMethodKit 工程量高 | 后续再做桌面助手或正式 IME |
| 浏览器插件 | 不做 | 和 Web/PWA 重叠 | 后续按需要扩展 |

适配原则：

- 客户端只负责采集音频、展示 partial/final、提交文本。
- 识别、记忆、后处理、评测都在 XGo 后端。
- Web 和 Android 复用同一套 WebSocket 协议，不各写一套业务逻辑。
- UI 可不同，但事件协议一致：`session.start`、`audio.chunk`、`audio.end`、`transcript.partial`、`transcript.final`。
- 端侧差异只在输入框接入方式：Web 写入页面 textarea；Android 通过 `InputConnection.commitText()` 写入系统输入框。

## 7. ASR 策略

产品上不能绑定讯飞。讯飞只是第一个 Provider，不是架构依赖。

24 小时版策略：

- 本地演示 Provider：`mock`，用于在没有云密钥时稳定验证端到端链路。
- 本地真实 Provider：`local`，通过 XGo Provider 调用 Python 3.12 + faster-whisper sidecar，在本机完成语音转写。
- 真实环境 Provider：优先接入成熟中文实时语音听写/转写服务，用于打通中文流式识别。
- 预留 Provider：阿里云、腾讯云、OpenAI、本地 FunASR/whisper.cpp。
- 客户端只认识 qiniu-ime 的统一事件协议，不认识任何厂商 SDK。
- Memory Engine、Post Processor、Eval Engine 不依赖任何厂商字段。
- Provider 的差异只存在于 `asr/provider/*` 适配器里。

这样做的收益：

- 后续换 ASR 不改前端。
- 可以按场景选择：中文办公走讯飞/阿里云，国际化走 OpenAI，本地隐私模式走 FunASR/whisper.cpp。
- 可以做 A/B 评测，比较不同 Provider 的 CER、延迟、成本。
- 单个厂商故障时直接报错和告警；是否切换 Provider 由显式配置或人工操作决定，不做静默 fallback。

24 小时内不自研 ASR 模型。自研没有竞争优势，反而会拖垮准确率和稳定性。竞争力来自“好 ASR Provider + 输入法级纠错体验 + 可证明指标 + 可替换架构”。

## 8. 速度怎么快

不要做这种慢链路：

```text
录完整段音频 -> 上传文件 -> 等 ASR 完成 -> 返回整段文字
```

也不要让业务代码绑定某个厂商：

```text
输入法核心 -> 直接调用讯飞字段/错误码/SDK
```

要做流式链路，但默认经过 qiniu-ime 后端网关，而不是客户端直接连 ASR 供应商：

```text
麦克风 PCM -> 40ms 音频块 -> qiniu-ime ASR Gateway -> ASR Provider WebSocket
                                      |
                                      +-> partial 实时返回
                                      +-> final 后执行热词纠错/个人记忆/后处理
                                      +-> 写入输入框
```

具体措施：

- 音频分片：16kHz、16bit、单声道 PCM，每 40ms 发送一帧，减少等待。
- 后端流式转发：用长连接 ASR Gateway 代理音频流，统一隐藏 API Key、记录指标、执行记忆学习。
- 部署同地域：后端和当前 Provider 接入点尽量同地域，减少后端中转带来的额外延迟。
- 本地 VAD：检测 600-800ms 静音后自动收尾，不让用户手动等。
- partial 优先显示：中间结果先给用户看，final 到达后用 diff 替换。
- 热词纠错在后端执行：ASR final 后立刻跑规则，不再请求大模型。
- 大模型润色不默认开启：避免把“快输入”变成“等 AI 改文案”。

目标指标：

| 指标 | 24 小时版目标 |
|---|---:|
| 首字出现延迟 P50 | <= 800ms |
| 停止说话到最终文本 P50 | <= 1200ms |
| 普通话短句 CER | <= 8% |
| 热词纠错命中率 | >= 90% |
| 用户二次修改次数 | 相比原始 ASR 降低 30% |

速度和后处理的取舍：

qiniu-ime 把处理链路拆成三档，保证“输入”不被 AI 润色拖慢：

| 阶段 | 是否阻塞出字 | 目标耗时 | 做什么 |
|---|---|---:|---|
| Streaming Fast Path | 不阻塞 | 首字 <= 800ms | ASR partial 直接显示 |
| Final Fast Path | 阻塞最终提交，但必须很短 | 100-300ms | 热词、个人记忆、标点、轻量清理 |
| AI Polish Path | 不阻塞 | 1-3s 可接受 | 逻辑修正、书面化、长文整理 |

用户体验：

1. 说话时先看到 ASR partial。
2. 停顿后进入 Final Fast Path，快速提交可用文本。
3. 如果开启逻辑修正，后台异步生成整理版，显示“替换为整理版”按钮。
4. 用户没有主动选择时，不用慢模型改写已经输入的内容。

这样可以同时满足“快输入”和“高质量整理”：默认快，按需深处理。

## 9. 准确率怎么做

准确率不是只靠 ASR，一个好输入法要做三层：

### 9.1 第一层：可替换的好 ASR

基础识别交给可替换 ASR Provider。24 小时版先用 `mock` Provider 完成可验收闭环；业务层只依赖统一 `ASRProvider` 接口。后续接入讯飞、阿里云、腾讯云、OpenAI、本地 ASR 时，不改输入法核心逻辑。

### 9.2 第二层：热词纠错

用户可以维护热词表：

```json
[
  {"term":"七牛云", "aliases":["七牛", "期牛云"]},
  {"term":"Kodo", "aliases":["扣豆", "可豆", "koduo"]},
  {"term":"XGo", "aliases":["x go", "艾克斯 go", "叉 go"]},
  {"term":"Vercel", "aliases":["vercel", "维赛尔"]}
]
```

算法：

1. 对 ASR final 文本做别名精确替换。
2. 对中文片段做拼音相似度匹配。
3. 对英文/缩写做编辑距离匹配。
4. 替换后高亮给用户 1 秒，用户可撤回。

这比“一错就重新说”更有效，也更像输入法产品。

### 9.3 第三层：可控的输入后处理

后处理不能强行替用户“变聪明”。聊天、吐槽、写日报、写邮件需要的文本风格完全不同。qiniu-ime 采用模式化处理：

| 模式 | 目标 | 处理策略 | 适用场景 |
|---|---|---|---|
| 原声模式 | 保留用户说话风格 | 保留语气词、重复词和口头表达，只做错别字/专名修正 | 和朋友聊天、吐槽、表达情绪 |
| 轻整理模式 | 少改字，提高可读性 | 自动标点、轻微空格/重复标点清理，保留大部分语气词 | 默认聊天、评论、短消息 |
| 清爽模式 | 去口头禅，保留原意 | 删除明显的“嗯、啊、那个”、重复起句、无意义停顿词 | 日报、笔记、长段输入 |
| 逻辑修正模式 | 把口语整理成有逻辑的书面表达 | 可调用 AI 做句序整理、合并重复表达、补标题/列表 | 邮件、工作总结、Prompt |

默认策略：

- 聊天场景默认 `轻整理模式`，允许用户一键切 `原声模式`。
- 工作场景默认 `清爽模式`。
- 邮件/日报默认 `逻辑修正模式`，但必须展示“原文/修正文”对比。
- 所有模式都保留“撤回到 ASR 原文”。

轻量后处理包括：

- 自动标点。
- 数字归一：`一二三四五六` 可转 `123456`，按场景决定。
- 口头禅清理：删除明显的“嗯、啊、那个”。
- 句尾空格和重复标点清理。

长文润色不默认阻塞输入。逻辑修正模式下也先提交快速结果，再异步给出“替换为整理版”的建议。

### 9.4 第四层：个人记忆和自动进化

语音输入法必须有记忆。否则同一个人名、项目名、英文缩写每次都错，用户会很快放弃。

qiniu-ime 的学习机制先聚焦“名词、短语、人名、专有词”，不做复杂声学模型训练。这样 24 小时内可实现，长期也可维护。

学习机制分三类：

| 记忆类型 | 来源 | 学习方式 | 例子 |
|---|---|---|---|
| 显式热词 | 用户手动添加 | 立即生效，最高优先级 | `Kodo`、`XGo`、同事姓名 |
| 隐式纠错 | 用户把识别结果改成了另一个文本 | 只抽取名词/短语候选，连续出现 2-3 次后提升为个人规则 | `扣豆` 多次被改为 `Kodo` |
| 场景记忆 | 用户在不同模式下确认的文本 | 按聊天/日报/邮件/Prompt 分场景加权 | Prompt 模式更偏向英文缩写 |

核心原则：

- 不保存原始音频，默认只保存文本纠错对：`raw_text -> accepted_text`。
- 不因一次修改就永久学习，避免把用户偶然改动变成错误规则。
- 每条规则有权重、命中次数、最近使用时间和撤回次数。
- 用户撤回某次修正后，降低对应规则权重。
- 用户可以在“我的记忆”里查看、禁用、删除规则。

一个简单可落地的学习流程：

```text
ASR final: "我们用扣豆上传文件"
用户确认文本: "我们用 Kodo 上传文件"
系统记录 correction("扣豆", "Kodo", scene="work")
同类纠错出现第 2 次：生成候选记忆
同类纠错出现第 3 次：自动启用个人规则，并在 UI 上提示
后续识别到 "扣豆"：自动修正为 "Kodo"，高亮 1 秒，可撤回
```

这比单纯提高 ASR 模型准确率更现实，因为用户的专有词永远在变。输入法的竞争力不是一次识别，而是越用越懂这个用户。

## 10. 技术方案

### 10.1 产品架构

先定产品架构，再决定部署。qiniu-ime 默认采用后端 ASR Gateway，因为它更可维护，也能支撑个人记忆、指标统计、供应商切换和隐私控制。

```text
Client
  ├─ Web/PWA 输入法工作台
  ├─ Android InputMethodService 壳
  └─ 后续可扩展桌面输入助手
        |
        | WebSocket: 40ms PCM audio chunks
        v
qiniu-ime Backend (XGo)
  ├─ ASR Gateway：统一 Provider 接口，转发 partial/final
  ├─ Post Processor：自动标点、口头禅清理、数字/英文修正
  ├─ Memory Engine：热词、纠错对、场景权重、撤回降权
  ├─ Eval Engine：CER、热词命中率、延迟统计、报告生成
  ├─ Observability：结构化日志、指标、追踪、告警
  └─ Admin API：词库、历史、指标、测试样本
        |
        +--> ASR Provider: xfyun / aliyun / tencent / openai / local
        +--> SQLite/PostgreSQL/Redis
```

为什么默认走后端网关：

- API Key 不暴露到客户端。
- 以后可替换 ASR 供应商，不改客户端。
- 个人记忆和纠错学习必须有服务端统一状态。
- Android、Web、桌面都能复用同一个输入核心。
- 可以做延迟、成本、准确率统计，方便证明产品做得好。

### 10.2 架构原则

qiniu-ime 的代码组织按“高内聚、低耦合、职责分离”设计，核心规则是依赖只能向内：

```text
api/websocket
   -> application/usecase
      -> domain
      <- ports/interfaces
   -> infrastructure/provider/xfyun
   -> infrastructure/storage/sqlite
```

分层职责：

| 层 | 负责什么 | 禁止什么 |
|---|---|---|
| `domain` | Transcript、MemoryRule、Correction、EvalMetric 等核心模型和纯规则 | 禁止 import 厂商 SDK、数据库、HTTP 框架 |
| `application` | 编排一次识别会话、应用记忆、生成指标 | 禁止写具体 SQL，禁止感知讯飞/阿里云字段 |
| `ports` | 定义接口：`ASRProvider`、`MemoryStore`、`MetricSink` | 只定义契约，不写实现 |
| `infrastructure/provider` | 适配讯飞、阿里云、腾讯云、OpenAI、本地 ASR | 禁止写业务纠错规则 |
| `infrastructure/storage` | SQLite/PostgreSQL/Redis 实现 | 禁止写输入法业务判断 |
| `observability` | 日志、指标、trace、告警事件 | 禁止反向影响业务决策 |
| `api` | WebSocket/REST 入参校验、鉴权、错误码 | 禁止直接操作数据库和厂商 SDK |

依赖方向：

- `domain` 不依赖任何外部包，尽量纯函数。
- `application` 依赖 `domain` 和 `ports`。
- `infrastructure` 实现 `ports`。
- `api` 调用 `application`。
- Provider 之间不能互相 import。

反冗余规则：

- 所有 ASR 结果先转换成统一 `TranscriptEvent`，后续逻辑只处理这一种结构。
- 所有 Provider 错误先转换成统一 `ProviderError`。
- 热词替换、CER 计算、场景权重只能有一个实现，测试覆盖后复用。
- 不在前端、后端、Provider 里重复写纠错规则。
- 不用 `if provider == "xfyun"` 散落全局；Provider 差异用适配器和配置解决。

### 10.3 ASR Provider 接口

核心接口只表达 qiniu-ime 需要什么，不暴露厂商细节：

```go
type ASRProvider interface {
    Name() string
    Capabilities() ProviderCapabilities
    Start(ctx context.Context, cfg ASRSessionConfig) (ASRStream, error)
}

type ASRStream interface {
    SendAudio(ctx context.Context, chunk AudioChunk) error
    Events() <-chan TranscriptEvent
    Close(ctx context.Context) error
}

type TranscriptEvent struct {
    Type       string // partial | final | error
    Text       string
    StartMs    int
    EndMs      int
    Confidence float64
    Provider   string
    TraceID    string
}
```

Provider 实现：

```text
server/infrastructure/provider/
├── xfyun/
│   └── provider.go
├── aliyun/
│   └── provider.go
├── tencent/
│   └── provider.go
├── openai/
│   └── provider.go
└── local/
    └── provider.go
```

路由策略放在独立 `ProviderRouter`：

```text
scene=work, language=zh-CN, privacy=cloud     -> xfyun
scene=work, language=zh-CN, privacy=private   -> local
scene=prompt, language=mixed, privacy=cloud   -> openai
provider=aliyun                               -> aliyun
```

这样新增厂商只需要新增一个 provider 包和契约测试，不改 Memory Engine、Post Processor、Eval Engine。

### 10.4 后端语言：固定 XGo

结论：**后端直接用 XGo，不写 Go 备选，不做兼容兜底。**

原因：

- 项目名和公司技术语境适合直接展示 XGo。
- 统一主语言能减少解释成本和冗余代码。
- 错误应该通过日志、测试和告警直接暴露，不靠兼容代码掩盖。
- 如果 XGo 的某个外部 SDK 接入失败，就修对应 Provider 适配器或删掉该 Provider，不切到另一套后端语言。

模块这样分：

| 模块 | 推荐语言 | 理由 |
|---|---|---|
| `asr_gateway` | 长连接、流式转发、partial/final 管理 |
| `memory_engine` | 热词、纠错对、场景权重、自动学习 |
| `postprocess` | 自动标点、口头禅清理、术语替换 |
| `eval_engine` | CER、热词命中率、延迟统计 |
| `http_api` | REST/WebSocket API |

Fail-fast 规则：

- 配置缺失：启动失败。
- Provider 鉴权失败：会话失败并记录 `provider_error`，不切换到其他 Provider。
- 不支持的音频格式：请求直接返回错误。
- 后处理规则冲突：测试失败，不在线上自动猜测。
- 记忆规则命中但被用户撤回：降权并记录，不吞掉事件。

推荐答辩表述：

> qiniu-ime 后端直接使用 XGo 实现 ASR Gateway、记忆学习引擎和评测引擎。我们不做静默兼容和隐式 fallback，问题通过结构化日志、契约测试和告警暴露，保证架构简单、职责清晰、长期可维护。

### 10.5 部署建议

部署最后决定：

```text
Frontend: Vercel / Netlify / 静态对象存储
Backend: Docker 容器部署到云服务器 / Fly.io / Railway / Render / 七牛云容器服务
Database: 24 小时版 SQLite；上线版 PostgreSQL + Redis
```

Vercel 仍然可以用，但只建议放前端。后端需要长连接和稳定运行时，独立容器更合理。

### 10.6 项目结构

```text
qiniu-ime/
├── app/
│   └── web/                      # Next.js + Tailwind Web/PWA 输入法工作台
├── server/
│   ├── cmd/qiniu-ime/            # 后端启动入口
│   ├── domain/                   # 核心模型和纯规则
│   ├── application/              # 识别会话、记忆学习、评测用例
│   ├── ports/                    # ASRProvider、MemoryStore 等接口
│   ├── infrastructure/
│   │   ├── provider/             # xfyun/aliyun/tencent/openai/local
│   │   └── storage/              # SQLite/PostgreSQL/Redis
│   ├── api/                      # REST + WebSocket API
│   └── config/                   # Provider 和策略配置
├── components/
│   ├── voice-panel.tsx           # 输入法面板
│   ├── transcript-view.tsx       # 实时文本
│   ├── hotword-editor.tsx        # 热词配置
│   └── metrics-bar.tsx           # 延迟/准确率指标
├── lib/
│   ├── audio/pcm.ts              # WebAudio 转 PCM
│   ├── asr/qiniu-ime-client.ts   # 连接 qiniu-ime 后端 WebSocket
│   └── metrics.ts                # 延迟和修改次数统计
├── fixtures/
│   └── eval-sentences.json       # 20 条固定测试句
├── deploy/
│   ├── Dockerfile
│   └── docker-compose.yml
└── docs/
    ├── product.md
    ├── api.md
    └── test-report.md
```

### 10.7 数据设计

24 小时版可以先用 SQLite，表结构保持简单，后续如果需要再迁移到 PostgreSQL。

```sql
users(
  id, device_id, created_at
)

asr_sessions(
  id, user_id, scene, provider, started_at, ended_at,
  first_token_ms, final_latency_ms, audio_ms
)

transcript_segments(
  id, session_id, raw_text, corrected_text, accepted_text,
  confidence, created_at
)

memory_terms(
  id, user_id, term, aliases_json, scene, weight,
  hit_count, reject_count, enabled, created_at, updated_at
)

correction_events(
  id, user_id, session_id, raw_text, accepted_text, scene,
  promoted_to_memory, created_at
)

eval_runs(
  id, cer_before, cer_after, hotword_hit_rate,
  p50_first_token_ms, p50_final_ms, created_at
)
```

学习规则：

- `memory_terms.weight` 初始为用户手动热词 `1.0`，自动学习候选为 `0.4`。
- 同类纠错重复出现时提升权重，命中后用户未撤回继续提升。
- 用户撤回或手动禁用时增加 `reject_count`，权重降低。
- `scene` 为空表示全局规则；有值时只在对应场景优先生效。

### 10.8 可观测性：日志、指标、看板、告警

语音输入法必须能回答四个问题：

- 是不是准？
- 是不是快？
- 哪个 Provider 更稳、更便宜？
- 用户到底在哪里改字、撤回、放弃？

所以 qiniu-ime 从第一版就打结构化日志和指标，不依赖人工猜。

#### 结构化日志

每次识别会话生成一个 `trace_id`，贯穿客户端、后端、Provider、后处理、记忆学习。

日志只记录必要文本，默认不保存原始音频；涉及用户文本时做脱敏、截断和采样。

```json
{
  "level": "info",
  "event": "asr_session_finished",
  "trace_id": "tr_20260523_001",
  "user_id_hash": "u_91af",
  "scene": "chat",
  "provider": "xfyun",
  "postprocess_mode": "light",
  "audio_ms": 8200,
  "first_token_ms": 640,
  "final_latency_ms": 1080,
  "raw_len": 28,
  "corrected_len": 29,
  "applied_memory_rules": 2,
  "user_edited": true,
  "accepted_len": 30,
  "error": null
}
```

关键日志事件：

| 事件 | 触发点 | 用途 |
|---|---|---|
| `asr_session_started` | 会话开始 | 统计入口流量、场景和 Provider |
| `first_token_received` | 首个 partial 到达 | 计算首字延迟 |
| `asr_final_received` | Provider 返回 final | 计算 Provider 延迟和失败率 |
| `postprocess_applied` | 后处理完成 | 统计模式、耗时、规则命中 |
| `memory_rule_applied` | 个人记忆命中 | 判断记忆是否有效 |
| `user_accept_submitted` | 用户确认最终文本 | 收集纠错反馈 |
| `user_revert_rule` | 用户撤回某条修正 | 降权错误规则 |
| `provider_error` | Provider 报错 | 故障定位、暴露问题、触发告警 |

#### 指标

核心指标按 `provider / scene / postprocess_mode / app_version` 维度聚合。

| 指标 | 含义 | 目标 |
|---|---|---:|
| `first_token_latency_ms` | 首字延迟 P50/P95 | P50 <= 800ms |
| `final_latency_ms` | 停止说话到 final 的延迟 | P50 <= 1200ms |
| `provider_error_rate` | Provider 会话失败率 | < 1% |
| `memory_hit_rate` | 个人记忆命中率 | 持续上升 |
| `memory_revert_rate` | 记忆命中后被撤回比例 | < 10% |
| `edit_distance_before_after` | qiniu-ime 修正减少的编辑距离 | 越高越好 |
| `user_edit_rate` | 用户最终还需要改字的比例 | 持续下降 |
| `cer_before / cer_after` | 原始 ASR 与 qiniu-ime 修正后的 CER | after 明显低于 before |
| `cost_per_audio_hour` | 每小时音频成本 | 可控 |

#### 看板

管理台提供四个图：

- 实时健康：QPS、在线会话、Provider error rate、P95 延迟。
- 准确率趋势：CER before/after、热词命中率、用户编辑率。
- Provider 对比：不同 Provider 的延迟、失败率、成本、CER。
- 记忆质量：新增规则数、命中率、撤回率、Top 错词。

#### 告警

24 小时版可以先写成阈值规则，后续接 Prometheus/Grafana 或云告警。

| 告警 | 条件 | 动作 |
|---|---|---|
| Provider 故障 | `provider_error_rate > 5%` 持续 5 分钟 | 触发告警，停止自动使用该 Provider；切换必须显式配置 |
| 延迟劣化 | `final_latency_p95 > 2500ms` 持续 10 分钟 | 触发告警；是否关闭 AI 逻辑修正由显式开关控制 |
| 记忆误伤 | `memory_revert_rate > 20%` | 暂停自动学习，只保留手动热词 |
| 成本异常 | 单小时音频成本超过阈值 | 限流或切低成本 Provider |
| 客户端异常 | WebSocket 断连率超过阈值 | 记录版本号和网络信息，提示重连 |

### 10.9 数据闭环：从日志到数据集再到产品优化

qiniu-ime 的迭代不靠感觉，而是靠用户确认和运行日志形成数据闭环。

```text
用户输入
  -> ASR raw text
  -> qiniu-ime corrected text
  -> 用户接受/修改/撤回
  -> correction_event
  -> 样本筛选和脱敏
  -> eval_samples
  -> 每次发版回归评测
  -> 调整 Provider、记忆规则、后处理策略
```

样本进入评测集的条件：

- 用户明确确认最终文本，或者用户手动修改了识别结果。
- 不包含手机号、身份证、邮箱、地址等敏感信息；命中敏感规则则只保留指标，不保留文本。
- 同类样本去重，避免热门词把数据集刷偏。
- 按场景分桶：聊天、日报、邮件、Prompt。
- 按错误类型标注：人名、项目名、英文缩写、数字、口头禅、标点、逻辑顺序。

数据表：

```sql
eval_samples(
  id,
  source,              -- user_correction / manual_fixture / provider_compare
  scene,
  provider,
  postprocess_mode,
  raw_text,
  corrected_text,
  accepted_text,
  error_tags_json,
  pii_status,          -- clean / redacted / rejected
  created_at
)
```

优化方式：

- Top 错词进入候选热词库。
- 高频 `raw -> accepted` 纠错对进入 Memory Engine 规则候选。
- 某个 Provider 在某类场景 CER 高，就调整 ProviderRouter。
- 某个后处理模式撤回率高，就降低该规则权重。
- 每次发版前跑固定 `eval_samples`，CER、延迟、撤回率不得劣化。

## 11. API

24 小时版 API 保持克制，但必须体现输入法核心闭环：流式识别、个人记忆、纠错反馈、评测报告。

### 11.1 流式识别

`WS /ws/asr`

客户端发送：

```json
{"type":"session.start","scene":"chat","sampleRate":16000,"format":"pcm16","enableMemory":true,"provider":"auto","postprocessMode":"light"}
```

```json
{"type":"audio.chunk","seq":1,"pcm":"<base64 pcm bytes>"}
```

```json
{"type":"audio.end"}
```

服务端返回：

```json
{"type":"transcript.partial","seq":8,"text":"我们用扣豆","latencyMs":640}
```

```json
{
  "type":"transcript.final",
  "rawText":"我们用扣豆上传文件",
  "correctedText":"我们用 Kodo 上传文件。",
  "appliedRules":[{"from":"扣豆","to":"Kodo","source":"personal_memory"}],
  "provider":"xfyun",
  "postprocessMode":"light",
  "latencyMs":1080
}
```

`provider` 可取：

- `auto`：由 ProviderRouter 根据场景、语言、隐私要求选择。
- `xfyun`、`aliyun`、`tencent`、`openai`、`local`：手动指定，用于演示、评测和调试。

`postprocessMode` 可取：

- `raw`：原声模式。
- `light`：轻整理模式。
- `clean`：清爽模式。
- `logic`：逻辑修正模式，AI 改写异步返回，不阻塞最终文本提交。

### 11.2 会话确认与学习

`POST /api/sessions/{sessionId}/accept`

请求：

```json
{
  "segmentId":"seg_001",
  "rawText":"我们用扣豆上传文件",
  "correctedText":"我们用 Kodo 上传文件。",
  "acceptedText":"我们用 Kodo 上传文件。"
}
```

返回：

```json
{
  "learned": true,
  "memoryCandidate": {"from":"扣豆","to":"Kodo","confidence":0.74}
}
```

### 11.3 个人记忆接口

`GET /api/memory`

`POST /api/memory/terms`

```json
{
  "terms": [
    {"term":"XGo","aliases":["x go","艾克斯 go"],"scene":"work"},
    {"term":"Kodo","aliases":["扣豆","可豆"],"scene":"work"}
  ]
}
```

`PATCH /api/memory/rules/{id}`

用于禁用、降权、删除错误学习规则。

### 11.4 评测报告

`POST /api/eval/report`

```json
{
  "items": [
    {
      "expected":"我们今天用 XGo 做一个语音输入法。",
      "raw":"我们今天用 x go 做一个语音输入法",
      "corrected":"我们今天用 XGo 做一个语音输入法。",
      "firstTokenMs":720,
      "finalMs":1040
    }
  ]
}
```

返回：

```json
{
  "cerBefore":0.083,
  "cerAfter":0.025,
  "hotwordHitRate":0.93,
  "p50FirstTokenMs":720,
  "p50FinalMs":1040
}
```

## 12. 前端体验

首屏就是输入法，不做营销页。

界面结构：

- 顶部：项目名 `qiniu-ime` + 当前状态。
- 中间：大文本框，显示识别后的最终文本。
- 底部：麦克风按钮、撤回按钮、清空按钮、复制/提交按钮。
- 右侧/下方：热词表和实时指标。

交互：

1. 点麦克风开始。
2. 说话时 partial 灰色显示。
3. final 变黑并进入文本框。
4. 热词修正用短暂高亮显示。
5. 用户点撤回可回到 ASR 原文。

## 13. 测试

24 小时版也要有测试，不然无法证明工程质量。

### 13.1 单测

重点测三个纯函数：

- `normalizeText(text)`：标点、空格、口头禅清理。
- `correctHotwords(text, terms)`：别名、拼音、编辑距离纠错。
- `calcCer(expected, actual)`：准确率评估。
- `routeProvider(policy)`：根据语言、场景、隐私要求选择 Provider。
- `applyPostprocessMode(text, mode)`：原声、轻整理、清爽、逻辑修正的行为边界。
- `extractMemoryCandidate(raw, accepted)`：只抽取名词/短语候选，避免学习整句废话。

目标覆盖率：核心算法 >= 90%。

命令：

```powershell
pnpm test -- --coverage
```

后端如果用 XGo/Go，单测重点覆盖 `domain` 和 `application`，不直接测厂商 SDK。

### 13.2 Provider 契约测试

每个 ASR Provider 必须通过同一组契约测试，保证可替换：

- `Start` 成功后能接收音频块。
- 必须至少返回一种 `partial` 或 `final` 事件。
- 错误必须转换成统一 `ProviderError`。
- `Close` 必须释放连接，不泄漏 goroutine/协程。
- 同一段 mock 音频在不同 Provider 下都能生成标准 `TranscriptEvent`。

Provider 契约测试只依赖 `ASRProvider` 接口，不依赖具体厂商包。新增阿里云、腾讯云、OpenAI、本地 ASR 时，只要通过这组测试，业务层无需修改。

### 13.3 E2E

用 Playwright 测 Web 输入流程：

```powershell
pnpm exec playwright test
```

覆盖：

- 页面可打开。
- 热词可新增。
- 模拟 ASR partial/final 后文本进入输入框。
- 指标栏显示延迟和 CER。
- 切换 Provider 为 `auto`、`xfyun`、`local` 时，前端协议不变。

### 13.4 人工演示评测

固定说 5 句：

1. 今天下午三点同步一下七牛云对象存储方案。
2. 我们用 XGo 写热词纠错模块。
3. 前端可以部署在 Vercel，后端用容器承载长连接。
4. Kodo 的 API 文档需要补充鉴权说明。
5. 语音输入法最重要的是准确率和响应速度。

展示：

- 原始 ASR 文本。
- 纠错后文本。
- 首字延迟。
- 最终延迟。
- 修改次数。

## 14. 24 小时排期

| 时间 | 任务 |
|---|---|
| 0-2h | 建 React + Vite 前端、XGo 后端骨架、演示文案 |
| 2-5h | 麦克风采集、PCM 转换、前端连接 qiniu-ime WebSocket |
| 5-8h | 后端 ASR Gateway + `ASRProvider` 接口 + mock Provider，转发 partial/final |
| 8-11h | 热词纠错、自动标点、口头禅清理、撤回修正 |
| 11-14h | 个人记忆：纠错对记录、规则提权、撤回降权 |
| 14-15h | 热词持久化、历史记录、纠错前后对比 |
| 15-17h | 场景模式：聊天、日报、邮件、Prompt |
| 17-19h | 单测、Provider 契约测试、Playwright、覆盖率报告 |
| 19-21h | Android `InputMethodService` 最小壳，复用 qiniu-ime WebSocket 协议 |
| 21-23h | 前端部署、后端容器部署、README、docs/test-report.md、演示脚本 |
| 23-24h | 录屏、修 bug、准备答辩讲稿 |

## 15. README 展示重点

参赛文档不要写一堆“未来可做”。要突出：

- 我们选择了一个最核心需求：提高文本输入效率。
- 准确率靠“可替换 ASR Provider + 热词纠错 + 后处理 + 个人记忆”，不是空喊 AI。
- 速度靠“客户端到 qiniu-ime 的流式 WebSocket + Provider 流式转发 + partial + 本地 VAD”，不是录完上传。
- 24 小时内能上线公开访问；前端可用 Vercel，后端用容器承载长连接。
- 有测试覆盖率和固定样本评测。
- XGo 可直接作为后端主语言；架构上用 ports/provider 隔离厂商依赖，保持可维护。

## 16. 资料依据

- Vercel WebSocket 限制：[Do Vercel Serverless Functions support WebSocket connections?](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)
- 讯飞语音听写 WebAPI：[语音听写流式版 WebAPI](https://www.xfyun.cn/doc/asr/voicedictation/API.html)
- Android 输入法官方文档：[Create an input method](https://developer.android.com/develop/ui/views/touch-and-input/creating-input-method)
- XGo 项目：[goplus/xgo](https://github.com/goplus/xgo)
