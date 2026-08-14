# Puts the site on a public URL anyone can open, including from a phone.
#
#   powershell -ExecutionPolicy Bypass -File scripts\share.ps1
#
# Starts three things and leaves them running after this window closes:
#   the database, a Cloudflare tunnel, and the web server.
#
# The address changes every time, because a free Cloudflare quick tunnel hands
# out a random one. That is why this script rewrites .env and rebuilds before
# starting the server — sign-in breaks if the app does not know its own public
# address. For an address that never changes, deploy to Vercel instead; see
# README.md.

$ErrorActionPreference = 'Stop'
$proj = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $proj '.logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null

function Running($port) {
  [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

# --- 1. database ------------------------------------------------------------
if (Running 5433) {
  Write-Host "Database already running."
} else {
  Write-Host "Starting the database..."
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run db:dev' `
    -WorkingDirectory $proj `
    -RedirectStandardOutput (Join-Path $logs 'db.log') `
    -RedirectStandardError (Join-Path $logs 'db.err.log') `
    -WindowStyle Hidden

  $waited = 0
  while (-not (Running 5433) -and $waited -lt 60) { Start-Sleep -Seconds 2; $waited += 2 }
  if (-not (Running 5433)) { throw "The database did not start. Check .logs\db.err.log" }
}

# --- 2. tunnel --------------------------------------------------------------
$cloudflared = @(
  'C:\Program Files (x86)\cloudflared\cloudflared.exe',
  'C:\Program Files\cloudflared\cloudflared.exe'
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $cloudflared) {
  throw "cloudflared is not installed. Run: winget install --id Cloudflare.cloudflared"
}

Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item (Join-Path $logs 'tunnel*.log') -ErrorAction SilentlyContinue

Write-Host "Opening the public tunnel..."
Start-Process -FilePath $cloudflared `
  -ArgumentList 'tunnel','--url','http://localhost:3007','--no-autoupdate' `
  -WorkingDirectory $proj `
  -RedirectStandardOutput (Join-Path $logs 'tunnel.log') `
  -RedirectStandardError (Join-Path $logs 'tunnel.err.log') `
  -WindowStyle Hidden

$url = $null
$waited = 0
while (-not $url -and $waited -lt 60) {
  Start-Sleep -Seconds 2; $waited += 2
  $text = ''
  foreach ($f in @('tunnel.log','tunnel.err.log')) {
    $p = Join-Path $logs $f
    if (Test-Path $p) { $text += (Get-Content $p -Raw -ErrorAction SilentlyContinue) }
  }
  $m = [regex]::Match($text, 'https://[a-z0-9-]+\.trycloudflare\.com')
  if ($m.Success) { $url = $m.Value }
}
if (-not $url) { throw "The tunnel did not report an address. Check .logs\tunnel.err.log" }

# --- 3. tell the app its own address ----------------------------------------
# Without this, sign-in fails: the session cookie and the callback are built
# from the address the app thinks it has.
$envPath = Join-Path $proj '.env'
$envText = [System.IO.File]::ReadAllText($envPath)
$envText = [regex]::Replace($envText, 'AUTH_URL="[^"]*"', "AUTH_URL=`"$url`"")
$envText = [regex]::Replace($envText, 'NEXT_PUBLIC_SITE_URL="[^"]*"', "NEXT_PUBLIC_SITE_URL=`"$url`"")
[System.IO.File]::WriteAllText($envPath, $envText, (New-Object System.Text.UTF8Encoding($false)))

# --- 4. web server ----------------------------------------------------------
if (Running 3007) {
  Write-Host "Stopping the old web server..."
  Get-NetTCPConnection -LocalPort 3007 -State Listen | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2
}

Write-Host "Building..."
Push-Location $proj
try { & npm run build 2>&1 | Out-Null } finally { Pop-Location }

Write-Host "Starting the web server..."
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run start -- -p 3007' `
  -WorkingDirectory $proj `
  -RedirectStandardOutput (Join-Path $logs 'web.log') `
  -RedirectStandardError (Join-Path $logs 'web.err.log') `
  -WindowStyle Hidden

$waited = 0
while (-not (Running 3007) -and $waited -lt 60) { Start-Sleep -Seconds 2; $waited += 2 }
if (-not (Running 3007)) { throw "The web server did not start. Check .logs\web.err.log" }

Write-Host ""
Write-Host "  The site is live at:"
Write-Host "  $url"
Write-Host ""
Write-Host "  Admin:  $url/admin"
Write-Host ""
Write-Host "  Leave this computer awake. Run scripts\stop-share.ps1 to take it down."
