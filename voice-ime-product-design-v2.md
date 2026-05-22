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

## 2. 项目名

项目名：**qiniu-ime**。

理由：

- `qiniu` 直接关联七牛，适合公司命题和技术品牌。
- `ime` 是 Input Method Editor 的行业通用叫法，评委/工程师能快速理解这是输入法项目。
- 名字短，适合仓库、包名、域名、Vercel 项目名：`qiniu-ime`。

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
| ASR 能力 | 中文实时语音识别应优先选成熟云 ASR，尤其是支持 WebSocket 流式返回的服务 | 24 小时版选讯飞语音听写/实时转写，不自研 ASR |
| 输入效率 | 用户真正痛点不是识别一次，而是错了以后要重复说、重复改 | 加热词纠错、撤回、原文/修正文对比、修改次数指标 |
| 速度链路 | 文件上传式 ASR 会慢，流式 WebSocket 能边说边出字 | 音频按小帧发送，partial 实时显示，final 到达后局部替换 |
| Vercel 部署 | Vercel 适合前端和短 API，不适合自己的 Serverless Function 承载 WebSocket 长连接 | Vercel 只签发讯飞鉴权 URL，浏览器直连讯飞 WebSocket |
| XGo/Go 后端 | Go 适合稳定服务，XGo 适合表达规则和体现公司技术特色；两者不是二选一 | 24 小时冲刺版采用 `Next.js + XGo/Go core`，音频不经后端中转，后端负责签名、热词、评测和报告 |

## 5. 24 小时 AI 辅助开发形态

如果 AI 可以全天跑，范围可以比普通一天 Hackathon 更大，但仍然不能发散。交付物定为“可上线、可演示、可评测、可讲工程判断”的 qiniu-ime：

必须完成：

- Vercel 上线 Web/PWA 输入法工作台。
- 接入讯飞实时语音听写/转写 WebSocket，支持 partial/final 实时出字。
- 热词纠错：支持七牛云、Kodo、XGo、Vercel、人名、项目名。
- 自动标点、口头禅清理、数字/英文缩写修正。
- 纠错前后对比：展示原始 ASR、qiniu-ime 修正后文本、用户最终确认文本。
- 指标看板：首字延迟、最终延迟、CER、热词命中率、用户修改次数。
- 固定样本评测：至少 20 条测试句，生成 `docs/test-report.md`。
- XGo/Go core：把热词纠错和评测逻辑做成可复用核心模块。
- 单测 + E2E：核心算法覆盖率尽量到 90%，Playwright 覆盖主流程。

冲刺加分项：

- Android `InputMethodService` 最小壳：能唤起 qiniu-ime 面板或 WebView，证明产品可变成系统输入法。
- 历史记录与词库持久化：用 Vercel KV、Upstash Redis 或 Supabase。
- 场景模式：聊天、日报、邮件、Prompt 四个模式，影响标点/格式化策略。
- 分享式演示链接：评委打开 Vercel 地址就能试。

这不是“少做”，而是把 AI 的产能投入到最有竞争力的闭环上：**准、快、少改、有报告、可上线**。

## 6. ASR 选型

24 小时版只选一个：**讯飞实时语音听写/转写**。

原因：

- 中文语音识别是主场景，讯飞在中文输入、方言和实时识别上更贴近题目。
- 官方提供 WebSocket 实时能力，适合边说边出字。
- 有动态修正、标点等能力可以直接服务输入法体验。
- 比自建 Whisper/FunASR 更适合 24 小时开发，风险低。

不建议 24 小时版自研 ASR 或本地模型。自研没有竞争优势，反而会拖垮准确率和稳定性。产品竞争力来自“好 ASR + 输入法级纠错体验 + 可证明指标”。

## 7. 速度怎么快

不要做这种慢链路：

```text
录完整段音频 -> 上传文件 -> 等 ASR 完成 -> 返回整段文字
```

要做流式链路：

```text
麦克风 PCM -> 40ms 音频块 -> 客户端直连讯飞 WebSocket -> partial 实时显示 -> final 自动纠错 -> 写入输入框
```

具体措施：

- 音频分片：16kHz、16bit、单声道 PCM，每 40ms 发送一帧，减少等待。
- 客户端直连 ASR：Vercel 只负责签名，不代理音频流，少一跳网络。
- 本地 VAD：检测 600-800ms 静音后自动收尾，不让用户手动等。
- partial 优先显示：中间结果先给用户看，final 到达后用 diff 替换。
- 热词纠错本地执行：ASR final 后立刻跑规则，不再请求大模型。
- 大模型润色不默认开启：避免把“快输入”变成“等 AI 改文案”。

目标指标：

| 指标 | 24 小时版目标 |
|---|---:|
| 首字出现延迟 P50 | <= 800ms |
| 停止说话到最终文本 P50 | <= 1200ms |
| 普通话短句 CER | <= 8% |
| 热词纠错命中率 | >= 90% |
| 用户二次修改次数 | 相比原始 ASR 降低 30% |

## 8. 准确率怎么做

准确率不是只靠 ASR，一个好输入法要做三层：

### 8.1 第一层：好 ASR

讯飞负责基础识别、动态修正、标点能力。第一天不做多供应商路由，避免复杂度失控。

### 8.2 第二层：热词纠错

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

### 8.3 第三层：输入法后处理

默认执行轻量后处理：

- 自动标点。
- 数字归一：`一二三四五六` 可转 `123456`，按场景决定。
- 口头禅清理：删除明显的“嗯、啊、那个”。
- 句尾空格和重复标点清理。

不默认做长文润色，因为会牺牲速度和用户可控性。

## 9. 技术方案

### 9.1 部署架构

Vercel 适合部署前端和短请求 API，但不适合把 Serverless Function 当长连接 WebSocket 服务器。  
所以 24 小时版架构这样做：

```text
Vercel Next.js App
  ├─ Web 输入法演示页
  ├─ /api/asr/sign        # 生成讯飞 WebSocket 签名 URL
  ├─ /api/hotwords        # 保存/读取热词
  └─ /api/eval/report     # 输出本次测试指标

Browser/PWA
  ├─ getUserMedia 获取麦克风
  ├─ WebAudio 转 16k PCM
  ├─ 直连讯飞 WebSocket
  ├─ partial/final 展示
  └─ 本地热词纠错和指标统计

Storage
  └─ Vercel KV / Upstash Redis / Supabase
```

这样速度最快：音频不经过自己的服务中转，Vercel 不承担 WebSocket 长连接压力。

### 9.2 Go / XGo 后端怎么选

结论：**可以用 Go 或 XGo 写后端，但 24 小时冲刺版不要让后端代理音频流。**

原因很直接：

- 语音流式识别最怕多一跳。浏览器直连讯飞 WebSocket，比“浏览器 -> 自己后端 -> 讯飞”更快、更稳、更省服务器资源。
- Vercel 适合前端和短 API，不适合承载自己的长连接 WebSocket 服务。
- qiniu-ime 的后端价值不在转发音频，而在签名、热词、纠错评测、指标报告。

推荐实现：

| 模块 | 推荐语言 | 理由 |
|---|---|---|
| `/api/asr/sign` | Go 或 TypeScript | 只做讯飞签名，逻辑短，部署快 |
| `/api/hotwords` | Go/XGo core + Vercel KV | 热词规则是产品核心，可以体现 XGo |
| `/api/eval/report` | XGo/Go | CER、热词命中率、延迟统计适合写成可复用评测模块 |
| ASR 长连接代理 | 暂不做 | 会拖慢速度，也和 Vercel 部署不匹配 |

如果要突出老板创立的 XGo，建议这样讲：

> qiniu-ime 使用 XGo 编写输入法核心规则和评测逻辑，把热词纠错、准确率评估、延迟统计做成可复用模块；Web 前端和 Vercel API 只是交付外壳。这样符合“架构做乘法”：规则核心未来可以复用到 Android IME、桌面 IME、浏览器插件和服务端网关。

如果时间充足，可以把后端进一步做成：

```text
Vercel Frontend
  ├─ Web/PWA 输入法 UI
  └─ 调用 qiniu-ime API

qiniu-ime-core
  ├─ XGo: hotword corrector / eval DSL
  └─ Go: HTTP API wrapper / tests / Vercel-compatible functions
```

如果后续不受 Vercel 限制，可以把完整后端部署到 Fly.io、Railway、Render 或云服务器，再用 Go/XGo 实现 ASR Gateway、用户体系、词库服务、评测服务。

### 9.3 项目结构

```text
qiniu-ime/
├── app/
│   ├── page.tsx                 # Vercel Web 演示页
│   ├── api/asr/sign/route.ts     # 讯飞签名 URL，TS 快速版
│   ├── api/hotwords/route.ts     # 热词接口
│   └── api/eval/report/route.ts  # 指标报告
├── api-go/
│   ├── sign.go                   # Go 版签名接口，可作为 Vercel Go Function 或独立服务
│   ├── hotwords.go               # Go 包装 XGo core
│   └── eval.go                   # Go 包装评测核心
├── components/
│   ├── voice-panel.tsx           # 输入法面板
│   ├── transcript-view.tsx       # 实时文本
│   ├── hotword-editor.tsx        # 热词配置
│   └── metrics-bar.tsx           # 延迟/准确率指标
├── lib/
│   ├── audio/pcm.ts              # WebAudio 转 PCM
│   ├── asr/xfyun-client.ts       # 讯飞 WebSocket 客户端
│   ├── ime/hotword-corrector.ts  # TS 版本纠错，供 Web 直接用
│   └── metrics.ts                # 延迟和修改次数统计
├── core/
│   └── xgo/
│       ├── corrector.xgo         # XGo 热词纠错核心
│       ├── evaluator.xgo         # XGo 评测逻辑
│       └── fixtures.xgo          # 固定样本和场景规则
├── fixtures/
│   └── eval-sentences.json       # 20 条固定测试句
└── docs/
    ├── product.md
    ├── api.md
    └── test-report.md
```

## 10. API

24 小时版 API 保持克制，只保留演示和评测必须的接口。

### 10.1 生成 ASR 签名

`POST /api/asr/sign`

请求：

```json
{"language":"zh_cn","accent":"mandarin","domain":"iat"}
```

返回：

```json
{
  "wssUrl": "wss://iat-api.xfyun.cn/v2/iat?...",
  "expiresAt": "2026-05-23T12:00:00+08:00"
}
```

注意：API Key、API Secret 只放 Vercel 环境变量，不进前端。

### 10.2 热词接口

`GET /api/hotwords`

`POST /api/hotwords`

```json
{
  "terms": [
    {"term":"XGo","aliases":["x go","艾克斯 go"]},
    {"term":"Kodo","aliases":["扣豆","可豆"]}
  ]
}
```

### 10.3 评测报告

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

## 11. 前端体验

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

## 12. 测试

24 小时版也要有测试，不然无法证明工程质量。

### 12.1 单测

重点测三个纯函数：

- `normalizeText(text)`：标点、空格、口头禅清理。
- `correctHotwords(text, terms)`：别名、拼音、编辑距离纠错。
- `calcCer(expected, actual)`：准确率评估。

目标覆盖率：核心算法 >= 90%。

命令：

```powershell
pnpm test -- --coverage
```

### 12.2 E2E

用 Playwright 测 Web 输入流程：

```powershell
pnpm exec playwright test
```

覆盖：

- 页面可打开。
- 热词可新增。
- 模拟 ASR partial/final 后文本进入输入框。
- 指标栏显示延迟和 CER。

### 12.3 人工演示评测

固定说 5 句：

1. 今天下午三点同步一下七牛云对象存储方案。
2. 我们用 XGo 写热词纠错模块。
3. 这个项目部署在 Vercel 上。
4. Kodo 的 API 文档需要补充鉴权说明。
5. 语音输入法最重要的是准确率和响应速度。

展示：

- 原始 ASR 文本。
- 纠错后文本。
- 首字延迟。
- 最终延迟。
- 修改次数。

## 13. 24 小时排期

| 时间 | 任务 |
|---|---|
| 0-2h | 建 Next.js/Vercel 项目、环境变量、页面骨架、演示文案 |
| 2-5h | 麦克风采集、PCM 转换、讯飞 WebSocket 直连 |
| 5-7h | partial/final 展示、自动停止、本地 VAD、延迟指标 |
| 7-10h | 热词纠错、自动标点、口头禅清理、撤回修正 |
| 10-13h | XGo/Go core：纠错规则、CER、热词命中率、评测报告 |
| 13-15h | 热词持久化、历史记录、纠错前后对比 |
| 15-17h | 场景模式：聊天、日报、邮件、Prompt |
| 17-19h | 单测、Playwright、覆盖率报告 |
| 19-21h | Android `InputMethodService` 最小壳或 WebView 壳 |
| 21-23h | Vercel 部署、README、docs/test-report.md、演示脚本 |
| 23-24h | 录屏、修 bug、准备答辩讲稿 |

## 14. README 展示重点

参赛文档不要写一堆“未来可做”。要突出：

- 我们选择了一个最核心需求：提高文本输入效率。
- 准确率靠“好 ASR + 热词纠错 + 后处理”，不是空喊 AI。
- 速度靠“流式直连 + partial + 本地 VAD”，不是录完上传。
- 24 小时内能上线 Vercel，可公开访问。
- 有测试覆盖率和固定样本评测。
- XGo 用在输入法核心规则/评测模块，体现工程判断和公司技术特色。

## 15. 资料依据

- Vercel WebSocket 限制：[Do Vercel Serverless Functions support WebSocket connections?](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)
- 讯飞语音听写 WebAPI：[语音听写流式版 WebAPI](https://www.xfyun.cn/doc/asr/voicedictation/API.html)
- Android 输入法官方文档：[Create an input method](https://developer.android.com/develop/ui/views/touch-and-input/creating-input-method)
- XGo 项目：[goplus/xgo](https://github.com/goplus/xgo)
