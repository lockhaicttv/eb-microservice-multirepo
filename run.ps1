param(
    [ValidateSet('start', 'stop', 'status')]
    [string]$Command = 'start',
    [switch]$NoInfra,
    [switch]$KeepInfra
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$logDir = Join-Path $root '.logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$backends = @(
    @{ Name = 'auth-backend';         Dir = 'auth/auth-backend';         Port = 5101 }
    @{ Name = 'catalog-backend';      Dir = 'catalog/catalog-backend';   Port = 5102 }
    @{ Name = 'order-backend';        Dir = 'order/order-backend';       Port = 5103 }
    @{ Name = 'payment-backend';      Dir = 'payment/payment-backend';   Port = 5104 }
    @{ Name = 'notification-backend'; Dir = 'notification/notification-backend'; Port = 5105 }
)

$bffs = @(
    @{ Name = 'auth-bff';         Dir = 'auth/auth-bff';         Port = 4101 }
    @{ Name = 'catalog-bff';      Dir = 'catalog/catalog-bff';   Port = 4102 }
    @{ Name = 'order-bff';        Dir = 'order/order-bff';       Port = 4103 }
    @{ Name = 'payment-bff';      Dir = 'payment/payment-bff';   Port = 4104 }
    @{ Name = 'notification-bff'; Dir = 'notification/notification-bff'; Port = 4105 }
)

$allPorts = @(3000) + ($bffs | ForEach-Object { $_.Port }) + ($backends | ForEach-Object { $_.Port })

function Test-Port($port) {
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-Port($port, $seconds = 60) {
    for ($i = 0; $i -lt ($seconds * 2); $i++) {
        if (Test-Port $port) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Start-One($svc, $label) {
    $dir = Join-Path $root $svc.Dir
    $out = Join-Path $logDir "$($svc.Name).out.log"
    $err = Join-Path $logDir "$($svc.Name).err.log"
    if (Test-Port $svc.Port) {
        Write-Host "[skip] $label $($svc.Name) already on :$($svc.Port)"
        return
    }
    Write-Host "[start] $label $($svc.Name) (:$($svc.Port))"
    Start-Process -FilePath 'node' -ArgumentList 'dist/main.js' -WorkingDirectory $dir `
        -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden | Out-Null
    if (-not (Wait-Port $svc.Port)) {
        Write-Warning "$($svc.Name) did not open :$($svc.Port) within timeout - see .logs\$($svc.Name).err.log"
    }
}

function Stop-All {
    foreach ($p in $allPorts) {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            Write-Host "[stop] :$p (pid $($c.OwningProcess))"
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    if (-not $KeepInfra) {
        Write-Host '[stop] docker compose down'
        docker compose down 2>&1 | Out-Host
    }
}

switch ($Command) {
    'start' {
        if (-not $NoInfra) {
            Write-Host '[start] docker compose up -d'
            docker compose up -d 2>&1 | Out-Host
        }
        foreach ($svc in $backends) { Start-One $svc 'backend' }
        foreach ($svc in $bffs) { Start-One $svc 'bff' }
        if (Test-Port 3000) {
            Write-Host '[skip] frontend already on :3000'
        } else {
            Write-Host '[start] frontend (:3000)'
            $out = Join-Path $logDir 'frontend.out.log'
            $err = Join-Path $logDir 'frontend.err.log'
            $cmd = "pnpm dev > `"$out`" 2> `"$err`""
            Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd `
                -WorkingDirectory (Join-Path $root 'frontend') -WindowStyle Hidden | Out-Null
            if (-not (Wait-Port 3000 90)) {
                Write-Warning "frontend did not open :3000 within timeout - see .logs\frontend.err.log"
            }
        }
        Write-Host ''
        Write-Host 'All services ready. Frontend: http://localhost:3000'
        Write-Host 'Kafka UI: http://localhost:8080 | Verdaccio: http://localhost:4873 | Conductor: http://localhost:8082'
    }
    'stop' {
        Stop-All
        Write-Host 'Stopped.'
    }
    'status' {
        foreach ($p in $allPorts) {
            $state = if (Test-Port $p) { 'LISTENING' } else { 'free' }
            Write-Host ("{0,-6} {1}" -f ":$p", $state)
        }
    }
}