# Local ASR Research

## Goal

Keep qiniu-ime free from cloud ASR lock-in. The first implementation uses a deterministic `mock` Provider for repeatable validation. A future `local` Provider can connect to a local ASR runtime.

## Candidates

- `sherpa-onnx`: good candidate for streaming ASR and local runtime integration.
- `FunASR`: good Chinese ASR candidate, especially if using its runtime service.
- `whisper.cpp`: good local/offline candidate, but more suitable for file/offline or pseudo-streaming workflows than low-latency IME streaming.

## Integration Boundary

The backend must not expose local ASR-specific fields outside `infrastructure/provider/local`.

The `local` Provider must implement:

```text
ASRProvider.Start -> ASRStream
ASRStream.SendAudio -> []TranscriptEvent
ASRStream.End -> []TranscriptEvent
```

If the local runtime is missing or misconfigured, `local` must fail fast with `provider local is not configured`.

