$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $backendPath "artisan"))) {
    throw "Laravel backend not found at: $backendPath"
}

if (-not (Test-Path (Join-Path $frontendPath "package.json"))) {
    throw "Frontend not found at: $frontendPath"
}

$backendCommand = "Set-Location '$backendPath'; php artisan serve --host=127.0.0.1 --port=8000"
$frontendCommand = "Set-Location '$frontendPath'; npm.cmd run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

Write-Host "Started backend and frontend in two new PowerShell windows."
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "API:      http://127.0.0.1:8000/api/health"
Write-Host "Frontend: http://127.0.0.1:5173"
