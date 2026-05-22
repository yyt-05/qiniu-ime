import argparse
import json
import sys

from faster_whisper import WhisperModel


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("audio_path")
    parser.add_argument("--model", default="tiny")
    parser.add_argument("--language", default="zh")
    parser.add_argument("--compute-type", default="int8")
    args = parser.parse_args()

    model = WhisperModel(args.model, device="cpu", compute_type=args.compute_type)
    segments, _ = model.transcribe(args.audio_path, language=args.language, vad_filter=True)
    text = "".join(segment.text for segment in segments).strip()
    print(json.dumps({"text": text}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        raise
