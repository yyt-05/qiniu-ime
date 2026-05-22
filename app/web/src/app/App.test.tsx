import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

class FakeSocket {
  static instances: FakeSocket[] = [];
  readyState: number = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: unknown[] = [];

  constructor(public url: string) {
    FakeSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
      this.emit({ type: 'session.ready', provider: 'mock' });
    }, 0);
  }

  send(value: string) {
    const parsed = JSON.parse(value);
    this.sent.push(parsed);
    if (parsed.type === 'session.start' && parsed.provider === 'xfyun') {
      this.emit({ type: 'error', error: 'provider xfyun is not configured' });
      return;
    }
    if (parsed.type === 'audio.chunk') {
      this.emit({ type: 'transcript.partial', text: '我们用扣豆', latencyMs: 12 });
    }
    if (parsed.type === 'audio.end') {
      this.emit({
        type: 'transcript.final',
        rawText: '我们用扣豆上传文件',
        correctedText: '我们用 Kodo 上传文件。',
        appliedRules: [{ from: '扣豆', to: 'Kodo', source: 'personal_memory' }],
        provider: 'mock',
        postprocessMode: 'light',
        latencyMs: 30
      });
    }
  }

  close() {}

  emit(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }
}

describe('App', () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeSocket);
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/api/memory')) {
        return Response.json({ terms: [{ id: '1', term: 'Kodo', aliases: ['扣豆'], scene: 'work' }] });
      }
      if (url.endsWith('/api/metrics/summary')) {
        return Response.json({ sessions: 1, providerErrors: 0 });
      }
      if (url.endsWith('/api/memory/terms')) {
        return Response.json({ terms: [{ id: '2', term: '七牛云', aliases: ['七牛'], scene: 'work' }] });
      }
      if (url.includes('/accept')) {
        return Response.json({ learned: true });
      }
      return Response.json({});
    }));
  });

  it('runs a mock voice session and renders corrected text', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /开始/ }));
    await waitFor(() => expect(screen.getByTestId('transcript-box')).toHaveTextContent('我们用扣豆'));
    await userEvent.click(screen.getByRole('button', { name: /停止/ }));
    await waitFor(() => expect(screen.getByTestId('transcript-box')).toHaveTextContent('Kodo'));
    expect(screen.getByText(/扣豆 -> Kodo/)).toBeInTheDocument();
  });

  it('adds a demo memory term', async () => {
    render(<App />);
    await userEvent.click(screen.getByLabelText('add-memory'));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/memory/terms'), expect.any(Object)));
  });

  it('accepts learning and can revert correction', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /开始/ }));
    await userEvent.click(screen.getByRole('button', { name: /停止/ }));
    await waitFor(() => expect(screen.getByTestId('transcript-box')).toHaveTextContent('Kodo'));
    await userEvent.click(screen.getByRole('button', { name: /撤回修正/ }));
    expect(screen.getByTestId('transcript-box')).toHaveTextContent('扣豆');
    await userEvent.click(screen.getByRole('button', { name: /确认学习/ }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/accept'), expect.any(Object)));
  });

  it('shows provider errors without fallback', async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByLabelText('provider'), 'xfyun');
    await userEvent.click(screen.getByRole('button', { name: /开始/ }));
    await waitFor(() => expect(screen.getByText(/provider xfyun/)).toBeInTheDocument());
  });

  it('switches postprocess modes', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '原声' }));
    await userEvent.click(screen.getByRole('button', { name: /开始/ }));
    await waitFor(() => expect(FakeSocket.instances.length).toBeGreaterThan(0));
    const socket = FakeSocket.instances.at(-1)!;
    expect(socket.sent.some((item) => (item as { postprocessMode?: string }).postprocessMode === 'raw')).toBe(true);
  });
});
