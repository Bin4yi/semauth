Set-Location "$PSScriptRoot\backend"

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example -- add your OPENAI_API_KEY" -ForegroundColor Yellow
}

if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    py -m venv .venv
}

$python = "$PSScriptRoot\backend\.venv\Scripts\python.exe"
$pip    = "$PSScriptRoot\backend\.venv\Scripts\pip.exe"

Write-Host "Installing dependencies..." -ForegroundColor Cyan
# .\.venv\Scripts\python.exe -m pip install -r requirements.txt

& $pip install -r requirements.txt

Write-Host "Starting SemAuth backend on http://localhost:8000" -ForegroundColor Green
& $python main.py
