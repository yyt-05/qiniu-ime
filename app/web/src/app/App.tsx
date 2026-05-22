'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Check, Gauge, Mic, Plus, Radio, RotateCcw, Square, Type, Zap } from 'lucide-react';
import { API_BASE, acceptCorrection, addMemoryTerm, fetchMemoryTerms, fetchMetrics, MemoryTerm } from '../lib/api';
import { PostprocessMode, Provider, QiniuImeClient, TranscriptEvent } from '../lib/qiniuImeClient';

type Status = 'idle' | 'connecting' | 'recording' | 'final' | 'error';
type InputMode = 'demo' | 'microphone';

export function App() {
  const [provider, setProvider] = useState<Provider>('mock');
  const [inputMode, setInputMode] = useState<InputMode>('demo');
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
  const client = useMemo(() => new QiniuImeClient(API_BASE), []);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const seqRef = useRef(1);
  const statusText: Record<Status, string> = {
    idle: '待输入',
    connecting: '连接中',
    recording: '识别中',
    final: '已生成',
    error: '出错'
  };

  useEffect(() => {
    void refreshMemory();
    void refreshMetrics();
    return () => client.close();
  }, [client]);

  async function refreshMemory() {
    setTerms(await fetchMemoryTerms());
  }

  async function refreshMetrics() {
    setMetrics(await fetchMetrics());
  }

  async function start() {
    setStatus('connecting');
    setError('');
    setPartial('');
    setRawText('');
    setFinalText('');
    setRules([]);
    try {
      await client.connect({ scene, provider, postprocessMode: mode, mockText, format: inputMode === 'demo' ? 'mock' : 'webm' }, handleEvent);
      setStatus('recording');
      if (inputMode === 'demo') {
        client.sendAudio(1);
        return;
      }
      await startMicrophone();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      return;
    }
    client.endAudio();
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
      client.endAudio();
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
      return;
    }
    if (event.type === 'transcript.partial') {
      setPartial(event.text ?? '');
      setLatency(event.latencyMs ?? null);
      return;
    }
    if (event.type === 'transcript.final') {
      setStatus('final');
      setRawText(event.rawText ?? '');
      setFinalText(event.correctedText ?? event.text ?? '');
      setLatency(event.latencyMs ?? null);
      setRules(event.appliedRules ?? []);
      void refreshMetrics();
    }
  }

  async function accept() {
    await acceptCorrection(rawText, finalText, scene);
    await refreshMemory();
  }

  async function addDemoTerm() {
    await addMemoryTerm({ term: '七牛云', aliases: ['七牛'], scene, enabled: true });
    await refreshMemory();
  }

  return (
    <main className="mx-auto max-w-6xl p-4 text-slate-900 sm:p-6">
      <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 font-bold text-blue-600">qiniu-ime</p>
          <h1 className="m-0 text-3xl font-bold tracking-normal">语音输入工作台</h1>
          <p className="mt-2 leading-7 text-slate-600">边说边出字，专有名词自动修正，确认后进入个人记忆。</p>
        </div>
        <div className={`w-fit rounded-lg px-3 py-2 font-bold ${status === 'error' ? 'bg-red-100 text-red-700' : status === 'idle' || status === 'connecting' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{statusText[status]}</div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-h-[600px] rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(23,32,51,0.06)]">
          <div className="grid items-end gap-3 md:grid-cols-[140px_140px_minmax(220px,1fr)]">
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              ASR
              <select className="h-10 rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-900" aria-label="provider" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
                {['mock', 'auto', 'xfyun', 'aliyun', 'tencent', 'openai', 'local'].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              场景
              <select className="h-10 rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-900" aria-label="scene" value={scene} onChange={(e) => setScene(e.target.value)}>
                <option value="work">工作</option>
                <option value="chat">聊天</option>
                <option value="prompt">Prompt</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              演示输入
              <input className="h-10 rounded-lg border border-slate-300 px-3 font-medium text-slate-900" value={mockText} onChange={(e) => setMockText(e.target.value)} />
            </label>
          </div>

          <div className="my-4 grid gap-3">
            <div className="grid gap-2 md:grid-cols-[64px_minmax(0,1fr)] md:items-center">
              <span className="text-sm font-bold text-slate-600">输入</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['demo', 'Mock 演示', Type],
                  ['microphone', '麦克风', Radio]
                ].map(([value, label, Icon]) => (
                  <button key={value as string} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 ${inputMode === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-800'}`} onClick={() => setInputMode(value as InputMode)}>
                    <Icon size={18} /> {label as string}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-[64px_minmax(0,1fr)] md:items-center">
              <span className="text-sm font-bold text-slate-600">后处理</span>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="group" aria-label="postprocess mode">
              {[
                ['raw', '原声'],
                ['light', '轻整理'],
                ['clean', '清爽'],
                ['logic', '逻辑修正']
              ].map(([value, label]) => (
                <button key={value} className={`min-h-10 rounded-lg border px-3 ${mode === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-800'}`} onClick={() => setMode(value as PostprocessMode)}>
                  {label}
                </button>
              ))}
              </div>
            </div>
          </div>

          <div className="my-4 flex min-h-64 items-start whitespace-pre-wrap rounded-lg border border-slate-300 bg-slate-50 p-5 text-2xl leading-loose" data-testid="transcript-box">
            <span className={!finalText && !partial ? 'text-slate-400' : ''}>
              {finalText || partial || '点击麦克风开始语音输入'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 text-white disabled:cursor-not-allowed disabled:opacity-45" onClick={start} disabled={status === 'recording' || status === 'connecting'}>
              <Mic size={18} /> 开始
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-slate-800 disabled:cursor-not-allowed disabled:opacity-45" onClick={stop} disabled={status !== 'recording'}>
              <Square size={18} /> 停止
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-slate-800 disabled:cursor-not-allowed disabled:opacity-45" onClick={() => setFinalText(rawText)} disabled={!rawText}>
              <RotateCcw size={18} /> 撤回修正
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-slate-800 disabled:cursor-not-allowed disabled:opacity-45" onClick={accept} disabled={!finalText}>
              <Check size={18} /> 确认学习
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="mb-2 block text-xs font-bold text-slate-600">原始 ASR</span>
              <p className="m-0 leading-7 text-slate-600">{rawText || partial || '等待识别结果'}</p>
            </div>
            <div className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="mb-2 block text-xs font-bold text-slate-600">qiniu-ime 修正</span>
              <p className="m-0 leading-7 text-slate-900">{finalText || '等待最终文本'}</p>
            </div>
          </div>

          {rules?.length ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">命中记忆：{rules.map((rule) => `${rule.from} -> ${rule.to}`).join('，')}</p> : null}
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</p>}
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(23,32,51,0.06)]">
            <h2 className="mb-4 text-base font-bold">实时指标</h2>
            <div className="flex items-center gap-2 border-b border-slate-100 py-3"><Zap size={16} /> 延迟：{latency ?? '-'} ms</div>
            <div className="flex items-center gap-2 border-b border-slate-100 py-3"><Activity size={16} /> 会话数：{String(metrics.sessions ?? '-')}</div>
            <div className="flex items-center gap-2 border-b border-slate-100 py-3"><Gauge size={16} /> Provider 错误：{String(metrics.providerErrors ?? '-')}</div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(23,32,51,0.06)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="mb-4 text-base font-bold">个人记忆</h2>
              <button className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white" aria-label="add-memory" onClick={addDemoTerm}><Plus size={16} /></button>
            </div>
            <ul className="m-0 grid list-none gap-2 p-0">
              {terms.map((term) => (
                <li className="grid gap-1 rounded-lg border border-slate-100 bg-slate-50 p-3" key={term.id ?? term.term}>
                  <strong>{term.term}</strong>
                  <span className="text-sm text-slate-600">{term.aliases?.join(' / ')}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
