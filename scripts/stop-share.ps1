# Takes the public link down and stops everything share.ps1 started.
#
#   powershell -ExecutionPolicy Bypass -File scripts\stop-share.ps1
#
# Worth running when you are done showing the site: while the tunnel is up, the
# admin sign-in page is reachable by anyone who has the address.

$stopped = @()

Get-Process cloudflared -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.Id -Force
  $stopped += 'tunnel'
}

foreach ($port in @(3007, 5433)) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    $stopped += $(if ($port -eq 3007) { 'web server' } else { 'database' })
  }
}

if ($stopped.Count -eq 0) {
  Write-Host "Nothing was running."
} else {
  Write-Host ("Stopped: " + (($stopped | Select-Object -Unique) -join ', '))
  Write-Host "The public link is now dead."
}
