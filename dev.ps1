# dev.ps1 — start KerjaCerdas backend + frontend in two PowerShell windows.
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\dev.ps1
#
# Each side runs in its own window so you can read logs separately and
# Ctrl-C either one without killing the other.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$python = "C:\Users\David\anaconda3\envs\jobmatching\python.exe"

if (-not (Test-Path $python)) {
    Write-Error "Conda env python not found at $python. Run: conda activate jobmatching"
    exit 1
}

Write-Host "Starting backend (FastAPI on :8000) ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$root'; & '$python' -m backend.app"
)

Start-Sleep -Seconds 2

Write-Host "Starting frontend (Vite on :3000) ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$root\frontend'; npm run dev"
)

Write-Host ""
Write-Host "Open: http://localhost:3000   (UI)"      -ForegroundColor Green
Write-Host "Open: http://127.0.0.1:8000/docs (API)" -ForegroundColor Green
