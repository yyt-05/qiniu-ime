# Local Whisper Workflow

qiniu-ime uses a local ASR sidecar instead of embedding Whisper logic directly into XGo business code.

## Install

Use Python 3.12 on Windows:

```powershell
py -3.12 -m pip install --user faster-whisper
py -3.12 -c "import faster_whisper; print('faster-whisper import ok')"
```

The project does not require system `ffmpeg` for this path because faster-whisper uses PyAV.

## Runtime

The XGo `local` Provider writes browser audio chunks into a temporary `.webm` file and calls:

```powershell
py -3.12 tools\local_asr\transcribe.py --model tiny --language zh <audio.webm>
```

Useful environment variables:

```powershell
$env:QINIU_IME_LOCAL_ASR_MODEL = "tiny"
$env:QINIU_IME_LOCAL_ASR_PYTHON = "py"
$env:QINIU_IME_LOCAL_ASR_SCRIPT = "D:\qiniu\tools\local_asr\transcribe.py"
```

`QINIU_IME_LOCAL_ASR_TEXT` is only for deterministic tests and demos. Do not use it as a production fallback.

## Experience Path

1. Start the XGo backend.
2. Start the Next.js frontend.
3. Open `http://127.0.0.1:5173`.
4. Select Provider `local`.
5. Select input mode `麦克风`.
6. Click `开始`, grant microphone permission, speak, then click `停止`.

The first real run downloads the selected Whisper model and will be slower.
