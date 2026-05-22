# qiniu-ime Implementation Plan

## Scope

This implementation targets the pre-deployment version:

- XGo backend with fail-fast behavior.
- Provider abstraction with a deterministic `mock` provider for local validation.
- Web/PWA workspace that connects to the backend WebSocket protocol.
- Memory, postprocess, evaluation, logs, and metrics in the backend.
- Unit coverage and Playwright E2E before final handoff.

## Validation Gates

Each module must pass:

1. Static/build validation.
2. Unit tests where applicable.
3. Local chain validation when the module is part of runtime flow.
4. Documentation update if implementation differs from design.

## Windows Setup Notes

XGo installation on this machine:

- `winget` is unavailable.
- Building XGo from source succeeded.
- The official installer attempted to create a symlink and failed under non-admin Windows privileges.
- Non-admin workaround: copy `xgo.exe` and `gop.exe` into `%USERPROFILE%\go\bin`.

Command pattern:

```powershell
$env:PATH = "$env:USERPROFILE\go\bin;$env:PATH"
xgo version
```

