export const API_BASE = process.env.NEXT_PUBLIC_QINIU_IME_API ?? 'http://127.0.0.1:8787';

export type MemoryTerm = {
  id?: string;
  term: string;
  aliases: string[];
  scene: string;
  weight?: number;
  enabled?: boolean;
};

export type CorrectTranscriptResult = {
  rawText: string;
  correctedText: string;
  provider: string;
  postprocessMode: string;
  appliedRules?: Array<{ from: string; to: string; source: string }>;
};

export async function fetchMemoryTerms(): Promise<MemoryTerm[]> {
  const response = await fetch(`${API_BASE}/api/memory`);
  if (!response.ok) throw new Error(`memory fetch failed: ${response.status}`);
  const data = await response.json();
  return data.terms;
}

export async function addMemoryTerm(term: MemoryTerm): Promise<MemoryTerm[]> {
  const response = await fetch(`${API_BASE}/api/memory/terms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ terms: [term] })
  });
  if (!response.ok) throw new Error(`memory add failed: ${response.status}`);
  const data = await response.json();
  return data.terms;
}

export async function acceptCorrection(rawText: string, acceptedText: string, scene: string) {
  const response = await fetch(`${API_BASE}/api/sessions/web/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText, acceptedText, scene })
  });
  if (!response.ok) throw new Error(`accept failed: ${response.status}`);
  return response.json();
}

export async function correctTranscript(rawText: string, scene: string, postprocessMode: string): Promise<CorrectTranscriptResult> {
  const response = await fetch(`${API_BASE}/api/transcripts/correct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText, scene, postprocessMode })
  });
  if (!response.ok) throw new Error(`correct failed: ${response.status}`);
  return response.json();
}

export async function fetchMetrics() {
  const response = await fetch(`${API_BASE}/api/metrics/summary`);
  if (!response.ok) throw new Error(`metrics failed: ${response.status}`);
  return response.json();
}
