$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "Operations Report - Windows Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed. Install Node.js 22 LTS, close PowerShell, and run this script again."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not available. Reinstall Node.js 22 LTS and run this script again."
}

Write-Host "1/5 Installing application packages..." -ForegroundColor Yellow
npm install

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  $secret = node -e "process.stdout.write(require('crypto').randomBytes(48).toString('base64url'))"
  $content = Get-Content ".env" -Raw
  $content = $content.Replace(
    "REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS",
    $secret
  )
  Set-Content ".env" $content -Encoding UTF8
}

Write-Host ""
Write-Host "2/5 Opening the SQL Server settings file." -ForegroundColor Yellow
Write-Host "Replace DB_SERVER, DB_PORT, DB_USER, DB_PASSWORD, and DB_DATABASE."
Write-Host "Save the file and close Notepad to continue."
Start-Process notepad.exe -ArgumentList (Join-Path $PSScriptRoot ".env") -Wait

Write-Host ""
Write-Host "3/5 Testing TypeScript..." -ForegroundColor Yellow
npm run typecheck

if (-not (Test-Path "data\admin.json")) {
  Write-Host ""
  Write-Host "4/5 Create the first administrator." -ForegroundColor Yellow
  Write-Host "The password will not appear while you type."
  npm run admin:create
} else {
  Write-Host "4/5 Administrator already exists; keeping the existing account." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "5/5 Building the local application..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Installation completed successfully." -ForegroundColor Green
Write-Host "Double-click START_WINDOWS.cmd to run Operations Report."
Write-Host "The browser address is http://127.0.0.1:3001"
Write-Host ""
Read-Host "Press Enter to close"
