# Windows XGo Setup Workflow

## Problem

On this Windows machine, `winget` is unavailable and XGo's source installer failed while creating a symlink:

```text
A required privilege is not held by the client.
```

## Working Setup

```powershell
$src = Join-Path $env:TEMP "xgo-src"
git clone --depth 1 https://github.com/goplus/xgo.git $src
Set-Location $src
cmd /c make.bat

$bin = Join-Path (go env GOPATH) "bin"
New-Item -ItemType Directory -Force -Path $bin | Out-Null
Copy-Item "$src\bin\xgo.exe" "$bin\xgo.exe" -Force
Copy-Item "$src\bin\xgo.exe" "$bin\gop.exe" -Force
Copy-Item "$src\bin\goptestgo.exe" "$bin\goptestgo.exe" -Force

$env:PATH = "$env:USERPROFILE\go\bin;$env:PATH"
xgo version
```

## Notes

- Prefer user-level install on locked-down Windows machines.
- Add `%USERPROFILE%\go\bin` to `PATH` before running `xgo`.
- Use quoted Go test flags in PowerShell:

```powershell
go test "-coverprofile=coverage.out" ./...
```

