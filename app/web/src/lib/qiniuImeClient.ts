export type PostprocessMode = 'raw' | 'light' | 'clean' | 'logic';
export type Provider = 'auto' | 'mock' | 'xfyun' | 'aliyun' | 'tencent' | 'openai' | 'local';

export type TranscriptEvent = {
  type: 'session.ready' | 'transcript.partial' | 'transcript.final' | 'error';
  text?: string;
  rawText?: string;
  correctedText?: string;
  provider?: string;
  postprocessMode?: string;
  latencyMs?: number;
  error?: string;
  appliedRules?: Array<{ from: string; to: string; source: string }>;
};

export type SessionOptions = {
  scene: string;
  provider: Provider;
  postprocessMode: PostprocessMode;
  mockText: string;
};

export class QiniuImeClient {
  private socket?: WebSocket;

  constructor(private readonly baseUrl: string) {}

  connect(options: SessionOptions, onEvent: (event: TranscriptEvent) => void): Promise<void> {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws/asr';
    this.socket = new WebSocket(wsUrl);
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('socket not initialized'));
        return;
      }
      let settled = false;
      this.socket.onmessage = (message) => {
        const event = JSON.parse(message.data) as TranscriptEvent;
        onEvent(event);
        if (event.type === 'session.ready' && !settled) {
          settled = true;
          resolve();
        }
        if (event.type === 'error' && !settled) {
          settled = true;
          reject(new Error(event.error ?? 'session failed'));
        }
      };
      this.socket.onopen = () => {
        this.send({
          type: 'session.start',
          scene: options.scene,
          sampleRate: 16000,
          format: 'pcm16',
          enableMemory: true,
          provider: options.provider,
          postprocessMode: options.postprocessMode,
          mockText: options.mockText
        });
      };
      this.socket.onerror = () => {
        if (!settled) {
          settled = true;
          reject(new Error('websocket connection failed'));
        }
      };
    });
  }

  sendAudio(seq: number, pcm = 'AA==') {
    this.send({ type: 'audio.chunk', seq, pcm });
  }

  endAudio() {
    this.send({ type: 'audio.end' });
  }

  close() {
    this.socket?.close();
  }

  private send(value: unknown) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('websocket is not open');
    }
    this.socket.send(JSON.stringify(value));
  }
}
