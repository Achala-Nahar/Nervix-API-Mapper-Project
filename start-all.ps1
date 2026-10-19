$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
docker compose up -d
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\start-backend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; if (!(Test-Path node_modules)) { npm install }; npm run dev"
Write-Host "Infrastructure started. Backend and frontend opened in separate terminals." -ForegroundColor Green
