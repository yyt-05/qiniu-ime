'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  Check,
  Copy,
  Gauge,
  Mic,
  Plus,
  Radio,
  RotateCcw,
  Server,
  Square,
  Terminal,
  Trash2,
  Type,
  Zap
} from 'lucide-react';
import { API_BASE, acceptCorrection, addMemoryTerm, correctTranscript, fetchMemoryTerms, fetchMetrics, MemoryTerm } from '../lib/api';
import { PostprocessMode, Provider, QiniuImeClient, TranscriptEvent } from '../lib/qiniuImeClient';

type Status = 'idle' | 'connecting' | 'recording' | 'stopping' | 'final' | 'error';
type InputMode = 'demo' | 'microphone';

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionErrorLike = Event & { error?: string };
type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const sceneOptions = [
  { value: 'chat', label: '聊天' },
  { value: 'work', label: '日报' },
  { value: 'mail', label: '邮件' }
] as const;

const postprocessOptions: Array<{ value: PostprocessMode; label: string }> = [
  { value: 'raw', label: '原声' },
  { value: 'light', label: '轻整理' },
  { value: 'clean', label: '清爽' },
  { value: 'logic', label: '逻辑修正' }
];

const waveformBars = [18, 42, 28, 64, 34, 78, 46, 90, 52, 72, 38, 84, 30, 58, 24, 68, 40, 82, 48, 74, 32, 62, 26, 54, 36, 70, 44, 88, 50, 66, 22, 56];

export function App() {
  const [provider, setProvider] = useState<Provider>('mock');
  const [inputMode, setInputMode] = useState<InputMode>('microphone');
  const [mode, setMode] = useState<PostprocessMode>('light');
  const [scene, setScene] = useState('work');
  const [mockText, setMockText] = useState('我们用扣豆上传文件');
  const [status, setStatus] = useState<Status>('idle');
  const [partial, setPartial] = useState('');
  const [rawText, setRawText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [rules, setRules] = useState<TranscriptEvent['appliedRules']>([]);
  const [terms, setTerms] = useState<MemoryTerm[]>([]);
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [copied, setCopied] = useState(false);
  const client = useMemo(() => new QiniuImeClient(API_BASE), []);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const demoEndTimerRef = useRef<number | null>(null);
  const speechFinalRef = useRef('');
  const speechInterimRef = useRef('');
  const speechStartedAtRef = useRef(0);
  const speechFinishingRef = useRef(false);
  const speechHadErrorRef = useRef(false);
  const speechCancelledRef = useRef(false);
  const seqRef = useRef(1);
  const statusText: Record<Status, string> = {
    idle: '待输入',
    connecting: '连接中',
    recording: '识别中',
    stopping: '生成中',
    final: '已生成',
    error: '出错'
  };
  const transcriptText = finalText || partial;
  const finalLatencyValues = (metrics.finalMs as number[] | undefined) ?? [];
  const firstTokenValues = (metrics.firstTokenMs as number[] | undefined) ?? [];
  const finalDelay = finalLatencyValues.at(-1) ?? latency ?? '-';
  const firstTokenDelay = firstTokenValues.at(-1) ?? '-';
  const providerErrors = String(metrics.providerErrors ?? '-');
  const sessions = String(metrics.sessions ?? '-');
  const browserSpeechMode = inputMode === 'microphone' && (provider === 'mock' || provider === 'auto');
  const activeProviderLabel = browserSpeechMode && (status === 'recording' || status === 'stopping' || Boolean(rawText || partial)) ? 'BROWSER' : provider.toUpperCase();
  const startButtonLabel = inputMode === 'microphone' ? '录音' : '开始';

  useEffect(() => {
    void refreshMemory();
    void refreshMetrics();
    return () => {
      clearDemoTimer();
      speechCancelledRef.current = true;
      recognitionRef.current?.abort();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      client.close();
    };
  }, [client]);

  async function refreshMemory() {
    try {
      setTerms(await fetchMemoryTerms());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refreshMetrics() {
    try {
      setMetrics(await fetchMetrics());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function start() {
    resetInputState();
    setStatus('connecting');
    try {
      if (inputMode === 'microphone') {
        if (browserSpeechMode) {
          const SpeechRecognition = getSpeechRecognitionConstructor();
          if (SpeechRecognition) {
            startBrowserSpeech(SpeechRecognition);
            return;
          }
          throw new Error('当前浏览器不支持实时语音识别。请使用 Chrome/Edge，或选择 local Provider 走本地 Whisper。');
        }
      }
      await startBackendSession(inputMode === 'demo' ? 'mock' : 'webm');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function resetInputState() {
    clearDemoTimer();
    recognitionRef.current?.abort();
    client.close();
    setError('');
    setPartial('');
    setRawText('');
    setFinalText('');
    setLatency(null);
    setRules([]);
    setCopied(false);
    speechFinalRef.current = '';
    speechInterimRef.current = '';
    speechFinishingRef.current = false;
    speechHadErrorRef.current = false;
    speechCancelledRef.current = false;
  }

  async function startBackendSession(format: 'mock' | 'webm') {
    await client.connect({ scene, provider, postprocessMode: mode, mockText, format }, handleEvent);
    setStatus('recording');
    if (format === 'mock') {
      if (!client.sendAudio(1)) {
        throw new Error('websocket is not open');
      }
      demoEndTimerRef.current = window.setTimeout(() => {
        if (client.endAudio()) {
          setStatus('stopping');
        }
      }, 450);
      return;
    }
    await startMicrophone();
  }

  function startBrowserSpeech(SpeechRecognition: SpeechRecognitionConstructor) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    recognitionRef.current = recognition;
    speechStartedAtRef.current = Date.now();

    recognition.onresult = (event) => {
      let finalTextSoFar = speechFinalRef.current;
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalTextSoFar += text;
        } else {
          interimText += text;
        }
      }
      speechFinalRef.current = finalTextSoFar;
      speechInterimRef.current = interimText;
      const displayText = `${finalTextSoFar}${interimText}`.trim();
      setPartial(displayText);
      if (displayText && latency === null) {
        setLatency(Date.now() - speechStartedAtRef.current);
      }
    };

    recognition.onerror = (event) => {
      speechHadErrorRef.current = true;
      setStatus('error');
      setError(speechErrorMessage(event.error));
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (speechCancelledRef.current) {
        return;
      }
      void finishBrowserSpeech(scene, mode);
    };

    setStatus('recording');
    recognition.start();
  }

  async function finishBrowserSpeech(activeScene: string, activeMode: PostprocessMode) {
    if (speechFinishingRef.current) {
      return;
    }
    speechFinishingRef.current = true;
    const spokenText = `${speechFinalRef.current}${speechInterimRef.current}`.trim();
    if (!spokenText) {
      if (!speechHadErrorRef.current) {
        setStatus('error');
        setError('没有识别到语音，请再录一次。');
      }
      return;
    }
    setStatus('stopping');
    setPartial(spokenText);
    setRawText(spokenText);
    try {
      const result = await correctTranscript(spokenText, activeScene, activeMode);
      setStatus('final');
      setRawText(result.rawText);
      setFinalText(result.correctedText || spokenText);
      setRules(result.appliedRules ?? []);
      setLatency(Date.now() - speechStartedAtRef.current);
      void refreshMetrics();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function speechErrorMessage(error?: string) {
    switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '麦克风权限被拒绝，请允许浏览器使用麦克风。';
    case 'no-speech':
      return '没有检测到语音，请靠近麦克风再试。';
    case 'network':
      return '浏览器语音识别服务不可用，请稍后再试或切换 local Provider。';
    default:
      return error ? `语音识别失败：${error}` : '语音识别失败';
    }
  }

  function getSpeechRecognitionConstructor() {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  }

  function stop() {
    if (recognitionRef.current) {
      setStatus('stopping');
      recognitionRef.current.stop();
      return;
    }
    clearDemoTimer();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      setStatus('stopping');
      recorderRef.current.stop();
      return;
    }
    if (client.endAudio()) {
      setStatus('stopping');
      return;
    }
    setStatus('error');
    setError('websocket is not open');
  }

  function clearDemoTimer() {
    if (demoEndTimerRef.current !== null) {
      window.clearTimeout(demoEndTimerRef.current);
      demoEndTimerRef.current = null;
    }
  }

  async function startMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('当前浏览器不支持麦克风采集');
    }
    seqRef.current = 1;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        void client.sendAudioBlob(seqRef.current++, event.data);
      }
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      if (!client.endAudio()) {
        setStatus('error');
        setError('websocket is not open');
      }
    };
    recorder.start(500);
  }

  function handleEvent(event: TranscriptEvent) {
    if (event.type === 'session.ready') {
      return;
    }
    if (event.type === 'error') {
      setStatus('error');
      setError(event.error ?? 'unknown error');
      void refreshMetrics();
      return;
    }
    if (event.type === 'transcript.partial') {
      setPartial(event.text ?? '');
      setLatency(event.latencyMs ?? null);
      return;
    }
    if (event.type === 'transcript.final') {
      clearDemoTimer();
      setStatus('final');
      setRawText(event.rawText ?? '');
      setFinalText(event.correctedText ?? event.text ?? '');
      setLatency(event.latencyMs ?? null);
      setRules(event.appliedRules ?? []);
      void refreshMetrics();
    }
  }

  async function accept() {
    try {
      await acceptCorrection(rawText, finalText, scene);
      await refreshMemory();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
      void refreshMetrics();
    }
  }

  async function addDemoTerm() {
    try {
      await addMemoryTerm({ term: '七牛云', aliases: ['七牛'], scene, enabled: true });
      await refreshMemory();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function copyText() {
    if (!transcriptText) {
      return;
    }
    await navigator.clipboard?.writeText(transcriptText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function clearText() {
    speechCancelledRef.current = true;
    recognitionRef.current?.abort();
    setPartial('');
    setRawText('');
    setFinalText('');
    setRules([]);
    setError('');
    setCopied(false);
    setStatus('idle');
  }

  return (
    <main className="h-screen w-screen bg-[#0D1117] text-white overflow-hidden flex flex-col">
      <header className="h-12 shrink-0 border-b border-slate-800 bg-[#070B12] text-xs uppercase tracking-[0.18em] text-slate-400">
        <div className="grid h-full grid-cols-[minmax(340px,25vw)_minmax(0,1fr)]">
          <div className="flex h-full items-center gap-2 border-r border-slate-800 px-4">
            <Terminal size={16} className="text-[#00FF88]" />
            <span className="font-bold text-white">qiniu-ime</span>
            <span className={`ml-auto h-2 w-2 ${status === 'error' ? 'bg-red-500' : status === 'recording' || status === 'stopping' ? 'bg-[#00FF88]' : 'bg-gray-600'}`} />
          </div>
          <div className="flex h-full items-center justify-between px-4">
            <span className="font-mono text-gray-500">语音工作站 / {activeProviderLabel} / {statusText[status]}</span>
            <div className="flex h-full items-center gap-6 font-mono">
              <MetricPill icon={<Zap size={14} />} label="首字" value={`${firstTokenDelay}ms`} />
              <MetricPill icon={<Gauge size={14} />} label="最终" value={`${finalDelay}ms`} />
              <MetricPill icon={<Activity size={14} />} label="错误" value={providerErrors} />
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 grid grid-cols-[minmax(340px,25vw)_minmax(0,1fr)] gap-0 overflow-hidden">
        <aside className="grid min-h-0 grid-rows-[1fr_auto] border-r border-slate-800 bg-[#060A11]">
          <div className="min-h-0 overflow-y-auto">
            <Panel title="场景模式">
              <div className="grid grid-cols-3 border border-gray-800">
                {sceneOptions.map((item) => (
                  <button
                    key={item.value}
                    className={`h-12 border-r border-gray-800 text-base font-medium last:border-r-0 ${scene === item.value ? 'bg-[#00FF88] text-black' : 'bg-black text-gray-300 hover:bg-gray-900'}`}
                    onClick={() => setScene(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="输入设置">
              <div className="grid gap-3">
                <label className="grid gap-1.5 text-sm text-gray-400">
                  识别引擎
                  <select className="h-11 border border-gray-800 bg-black px-3 font-mono text-base text-white outline-none focus:border-[#00FF88]" aria-label="provider" value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
                    {['mock', 'auto', 'xfyun', 'aliyun', 'tencent', 'openai', 'local'].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm text-gray-400">
                  演示文本
                  <input className="h-11 border border-gray-800 bg-black px-3 text-base text-white outline-none focus:border-[#00FF88]" aria-label="演示输入" value={mockText} onChange={(event) => setMockText(event.target.value)} />
                </label>
                <div className="grid grid-cols-2 border border-gray-800">
                  {[
                    ['demo', 'Mock 演示', Type],
                    ['microphone', '录音识别', Radio]
                  ].map(([value, label, Icon]) => (
                    <button key={value as string} className={`flex h-12 items-center gap-2 border-r border-gray-800 px-4 text-base font-medium last:border-r-0 ${inputMode === value ? 'bg-cyan-400 text-black' : 'bg-black text-gray-300 hover:bg-gray-900'}`} onClick={() => setInputMode(value as InputMode)}>
                      <Icon size={15} /> {label as string}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="后处理" defaultOpen={false}>
              <div className="grid grid-cols-2 border border-gray-800">
                {postprocessOptions.map((item, index) => (
                  <button
                    key={item.value}
                    className={`h-12 border-gray-800 text-base font-medium ${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b' : ''} ${mode === item.value ? 'bg-[#00FF88] text-black' : 'bg-black text-gray-300 hover:bg-gray-900'}`}
                    onClick={() => setMode(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="热词列表" defaultOpen={false}>
              <button className="mb-3 flex h-11 w-full items-center gap-2 border border-gray-800 bg-black px-3 text-base text-gray-300 hover:border-[#00FF88] hover:text-[#00FF88]" aria-label="add-memory" onClick={addDemoTerm}>
                <Plus size={16} /> 添加演示热词
              </button>
              <div className="grid gap-0 border border-gray-800">
                {terms.map((term) => (
                  <div className="border-b border-gray-800 bg-black px-3 py-2 last:border-b-0" key={term.id ?? term.term}>
                    <div className="font-mono text-base text-[#00FF88]">{term.term}</div>
                    <div className="mt-1 truncate text-sm text-gray-500">{term.aliases?.join(' / ')}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="border-t border-gray-800 bg-black p-3">
            <div className="mb-3 grid grid-cols-2 gap-px bg-gray-800">
              <button className="flex h-12 items-center gap-2 bg-gray-950 px-4 text-base text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-600" onClick={start} disabled={status === 'recording' || status === 'connecting' || status === 'stopping'}>
                <Mic size={16} className="text-[#00FF88]" /> {startButtonLabel}
              </button>
              <button className="flex h-12 items-center gap-2 bg-gray-950 px-4 text-base text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-600" onClick={stop} disabled={status !== 'recording'}>
                <Square size={16} className="text-red-400" /> 停止
              </button>
            </div>
            <details className="group mb-3 border border-gray-800">
              <summary className="flex h-10 cursor-pointer list-none items-center justify-between bg-gray-950 px-3 text-base text-gray-300 hover:bg-gray-900">
                <span>更多操作</span>
                <span className="inline-block font-mono text-sm text-[#00FF88] transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="grid grid-cols-2 gap-px bg-gray-800">
                <button className="flex h-11 items-center gap-2 bg-gray-950 px-3 text-base text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-600" onClick={accept} disabled={!finalText}>
                  <Check size={16} className="text-cyan-400" /> 确认学习
                </button>
                <button className="flex h-11 items-center gap-2 bg-gray-950 px-3 text-base text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-600" onClick={() => setFinalText(rawText)} disabled={!rawText}>
                  <RotateCcw size={16} /> 撤回修正
                </button>
                <button className="flex h-11 items-center gap-2 bg-gray-950 px-3 text-base text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-600" onClick={copyText} disabled={!transcriptText}>
                  <Copy size={16} /> {copied ? '已复制' : '复制'}
                </button>
                <button className="flex h-11 items-center gap-2 bg-gray-950 px-3 text-base text-red-300 hover:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-700" onClick={clearText} disabled={!transcriptText && !error}>
                  <Trash2 size={16} /> 清空
                </button>
              </div>
            </details>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-gray-500">
              <span>状态</span>
              <span className={status === 'error' ? 'text-red-400' : 'text-[#00FF88]'}>{statusText[status]}</span>
              <span>会话</span>
              <span className="text-white">{sessions}</span>
            </div>
          </div>
        </aside>

        <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_15vh] bg-[#0D1117]">
          <div className="min-h-0 overflow-y-auto bg-[#0D1117]" data-testid="transcript-box">
            <div className="min-h-full whitespace-pre-wrap px-10 py-8 font-mono text-4xl leading-[1.25] tracking-normal text-slate-50 lg:text-5xl">
              {transcriptText ? (
                transcriptText
              ) : (
                <span className="text-slate-700">点击麦克风开始语音输入...</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 bg-[#101828]">
            <div className="grid h-full grid-cols-[minmax(0,1fr)_15vw]">
              <div className="flex h-full items-end gap-1 px-10 pb-4" aria-hidden="true">
                {waveformBars.map((height, index) => (
                  <span
                    className={`w-1.5 ${status === 'recording' || status === 'stopping' ? 'bg-[#00FF88]' : 'bg-slate-700'}`}
                    key={`${height}-${index}`}
                    style={{ height: `${height}%`, opacity: status === 'recording' || status === 'stopping' ? 0.45 + (index % 5) * 0.1 : 0.45 }}
                  />
                ))}
              </div>
              <div className="border-l border-slate-800 p-3 font-mono text-[11px] text-slate-500">
                <div className="mb-2 flex items-center gap-2 text-[#00FF88]">
                  <Server size={15} /> 实时链路
                </div>
                <TraceRow label="原始" value={rawText || partial || '-'} />
                <TraceRow label="修正" value={finalText || '-'} />
                <TraceRow label="规则" value={rules?.length ? rules.map((rule) => `${rule.from} -> ${rule.to}`).join(' / ') : '-'} />
                <TraceRow label="错误" value={error || '-'} tone={error ? 'error' : 'normal'} />
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Panel({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-gray-800" open={defaultOpen}>
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 font-medium text-base text-gray-300 hover:bg-gray-900">
        <span>{title}</span>
        <span className="inline-block font-mono text-sm text-[#00FF88] transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="px-4 pb-4">
        {children}
      </div>
    </details>
  );
}

function MetricPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-[#00FF88]">{icon}</span>
      <span className="text-gray-500">{label}</span>
      <strong className="text-white">{value}</strong>
    </span>
  );
}

function TraceRow({ label, value, tone = 'normal' }: { label: string; value: string; tone?: 'normal' | 'error' }) {
  return (
    <div className="grid grid-cols-[58px_1fr] gap-2 border-t border-gray-800 py-2">
      <span className="text-gray-600">{label}</span>
      <span className={`truncate ${tone === 'error' ? 'text-red-400' : 'text-gray-300'}`}>{value}</span>
    </div>
  );
}
