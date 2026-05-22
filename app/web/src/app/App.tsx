import { useEffect, useMemo, useState } from 'react';
import { Mic, Square, RotateCcw, Check, Plus, Activity } from 'lucide-react';
import { API_BASE, acceptCorrection, addMemoryTerm, fetchMemoryTerms, fetchMetrics, MemoryTerm } from '../lib/api';
import { PostprocessMode, Provider, QiniuImeClient, TranscriptEvent } from '../lib/qiniuImeClient';

type Status = 'idle' | 'connecting' | 'recording' | 'final' | 'error';

export function App() {
  const [provider, setProvider] = useState<Provider>('mock');
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
      await client.connect({ scene, provider, postprocessMode: mode, mockText }, handleEvent);
      setStatus('recording');
      client.sendAudio(1);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function stop() {
    client.endAudio();
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
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">qiniu-ime</p>
          <h1>说得自然，写得准确</h1>
        </div>
        <div className={`status status-${status}`}>{status}</div>
      </section>

      <section className="workspace">
        <div className="panel transcript-panel">
          <div className="toolbar">
            <select aria-label="provider" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              {['mock', 'auto', 'xfyun', 'aliyun', 'tencent', 'openai', 'local'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select aria-label="scene" value={scene} onChange={(e) => setScene(e.target.value)}>
              <option value="work">工作</option>
              <option value="chat">聊天</option>
              <option value="prompt">Prompt</option>
            </select>
          </div>

          <div className="segmented" role="group" aria-label="postprocess mode">
            {[
              ['raw', '原声'],
              ['light', '轻整理'],
              ['clean', '清爽'],
              ['logic', '逻辑修正']
            ].map(([value, label]) => (
              <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value as PostprocessMode)}>
                {label}
              </button>
            ))}
          </div>

          <label className="mock-input">
            演示输入
            <input value={mockText} onChange={(e) => setMockText(e.target.value)} />
          </label>

          <div className="transcript-box" data-testid="transcript-box">
            {finalText || partial || '点击麦克风开始语音输入'}
          </div>

          {rawText && <p className="raw">原始 ASR：{rawText}</p>}
          {rules?.length ? <p className="rules">命中记忆：{rules.map((rule) => `${rule.from} -> ${rule.to}`).join('，')}</p> : null}
          {error && <p className="error">{error}</p>}

          <div className="actions">
            <button className="primary" onClick={start} disabled={status === 'recording' || status === 'connecting'}>
              <Mic size={18} /> 开始
            </button>
            <button onClick={stop} disabled={status !== 'recording'}>
              <Square size={18} /> 停止
            </button>
            <button onClick={() => setFinalText(rawText)} disabled={!rawText}>
              <RotateCcw size={18} /> 撤回修正
            </button>
            <button onClick={accept} disabled={!finalText}>
              <Check size={18} /> 确认学习
            </button>
          </div>
        </div>

        <aside className="side">
          <section className="panel">
            <h2>指标</h2>
            <div className="metric"><Activity size={16} /> 首/终延迟：{latency ?? '-'} ms</div>
            <div className="metric">会话数：{String(metrics.sessions ?? '-')}</div>
            <div className="metric">Provider 错误：{String(metrics.providerErrors ?? '-')}</div>
          </section>

          <section className="panel">
            <div className="row">
              <h2>个人记忆</h2>
              <button className="icon" aria-label="add-memory" onClick={addDemoTerm}><Plus size={16} /></button>
            </div>
            <ul className="memory-list">
              {terms.map((term) => (
                <li key={term.id ?? term.term}>
                  <strong>{term.term}</strong>
                  <span>{term.aliases?.join(' / ')}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}

