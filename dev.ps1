<#
.SYNOPSIS
    Starts the full MortgageModeler dev stack.

.DESCRIPTION
    1. Makes sure Docker Desktop is running and starts Postgres (waits until healthy).
    2. Prepares the platform service (.env, npm install if needed, Prisma generate + migrate).
    3. Opens compute, platform and frontend in their own Windows Terminal tabs
       (or separate PowerShell windows if Windows Terminal isn't installed).

    Close a tab (or Ctrl+C in it) to stop that service.

.PARAMETER Stop
    Stop the Postgres container instead of starting everything.

.EXAMPLE
    .\dev.ps1
    .\dev.ps1 -Stop
#>
param([switch]$Stop)

$root = $PSScriptRoot
$compose = Join-Path $root 'docker-compose.yml'

function Fail($msg) { Write-Host $msg -ForegroundColor Red; exit 1 }
function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

if ($Stop) {
    Step 'Stopping Postgres'
    docker compose -f $compose stop
    exit $LASTEXITCODE
}

# --- Docker / Postgres ------------------------------------------------------

function Test-Docker { docker info *> $null; return $LASTEXITCODE -eq 0 }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail 'Docker is not installed or not on PATH.' }

if (-not (Test-Docker)) {
    Step 'Starting Docker Desktop'
    $desktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path $desktop)) { Fail "Docker isn't running and Docker Desktop wasn't found at $desktop." }
    Start-Process $desktop
    $deadline = (Get-Date).AddMinutes(3)
    while (-not (Test-Docker)) {
        if ((Get-Date) -gt $deadline) { Fail 'Docker did not become ready within 3 minutes.' }
        Start-Sleep -Seconds 3
    }
}

Step 'Starting Postgres'
docker compose -f $compose up -d --wait
if ($LASTEXITCODE -ne 0) { Fail 'Postgres failed to start.' }

# --- Platform prep ----------------------------------------------------------

$platform = Join-Path $root 'platform'
$frontend = Join-Path $root 'frontend'
$compute  = Join-Path $root 'compute'

if (-not (Test-Path "$platform\.env")) {
    Step 'Creating platform/.env from .env.example'
    Copy-Item "$platform\.env.example" "$platform\.env"
}

foreach ($dir in @($platform, $frontend)) {
    if (-not (Test-Path "$dir\node_modules")) {
        Step "npm install in $(Split-Path $dir -Leaf)"
        Push-Location $dir; npm install; $code = $LASTEXITCODE; Pop-Location
        if ($code -ne 0) { Fail "npm install failed in $dir" }
    }
}

if (-not (Test-Path "$compute\venv\Scripts\python.exe")) {
    Fail 'compute/venv not found. Create it first: cd compute; python -m venv venv; venv\Scripts\pip install -r requirements.txt'
}

Step 'Prisma generate + migrate deploy'
Push-Location $platform
npx prisma generate
if ($LASTEXITCODE -eq 0) { npx prisma migrate deploy }
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { Fail 'Prisma step failed.' }

# --- Launch services --------------------------------------------------------

$services = @(
    @{ Name = 'compute';  Dir = $compute;  Cmd = '.\venv\Scripts\python.exe -m uvicorn app.main:app --reload' }
    @{ Name = 'platform'; Dir = $platform; Cmd = 'npm run start:dev' }
    @{ Name = 'frontend'; Dir = $frontend; Cmd = 'npm run dev' }
)

# Encode each command so quoting/semicolons survive being passed through wt.
function Get-Encoded($svc) {
    $script = "`$host.UI.RawUI.WindowTitle = '$($svc.Name)'; Set-Location '$($svc.Dir)'; $($svc.Cmd)"
    [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
}

Step 'Launching compute, platform and frontend'
if (Get-Command wt -ErrorAction SilentlyContinue) {
    $wtArgs = @('-w', 'new')
    $first = $true
    foreach ($svc in $services) {
        if (-not $first) { $wtArgs += ';' }
        $first = $false
        $wtArgs += @('new-tab', '--title', $svc.Name, '--suppressApplicationTitle', '-d', $svc.Dir,
                     'powershell', '-NoExit', '-EncodedCommand', (Get-Encoded $svc))
    }
    & wt @wtArgs
} else {
    foreach ($svc in $services) {
        Start-Process powershell -WorkingDirectory $svc.Dir -ArgumentList '-NoExit', '-EncodedCommand', (Get-Encoded $svc)
    }
}

Write-Host ''
Write-Host 'Services starting:' -ForegroundColor Green
Write-Host '  Frontend  http://localhost:3000'
Write-Host '  Platform  http://localhost:3001'
Write-Host '  Compute   http://localhost:8000/docs'
Write-Host '  Postgres  localhost:5432'
Write-Host ''
Write-Host 'Close the tabs to stop the services. Run .\dev.ps1 -Stop to stop Postgres.'
