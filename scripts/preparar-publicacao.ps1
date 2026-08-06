$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $PSScriptRoot
$workDirectory = Join-Path $projectDirectory 'work'
$statusFile = Join-Path $workDirectory 'publish-build-status.txt'
$logFile = Join-Path $workDirectory 'publish-build.log'
$bundledPnpm = 'C:\Users\taran\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
$bundledNodeDirectory = 'C:\Users\taran\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'

New-Item -ItemType Directory -Path $workDirectory -Force | Out-Null
[IO.File]::WriteAllText($statusFile, 'running', (New-Object System.Text.UTF8Encoding($false)))
[IO.File]::WriteAllText($logFile, '', (New-Object System.Text.UTF8Encoding($false)))

Write-Host ''
Write-Host 'Modo Eixo - preparacao da versao privada' -ForegroundColor DarkYellow
Write-Host 'Esta etapa pode levar alguns minutos.'
Write-Host ''

if (Test-Path -LiteralPath $bundledPnpm) {
    $pnpm = $bundledPnpm
}
else {
    $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
    if (-not $pnpmCommand) {
        throw 'O preparador do projeto nao foi encontrado.'
    }
    $pnpm = $pnpmCommand.Source
}

if (Test-Path -LiteralPath (Join-Path $bundledNodeDirectory 'node.exe')) {
    $currentProcessPath = [Environment]::GetEnvironmentVariable('Path', 'Process')
    [Environment]::SetEnvironmentVariable('Path', "$bundledNodeDirectory;$currentProcessPath", 'Process')
}

Push-Location $projectDirectory
try {
    Write-Host 'Preparando componentes do aplicativo...'
    $env:CI = 'true'
    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & $pnpm install --no-frozen-lockfile 2>&1 | Tee-Object -FilePath $logFile -Append
    $installExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedErrorActionPreference
    if ($installExitCode -ne 0) {
        [IO.File]::WriteAllText($statusFile, 'install_failed', (New-Object System.Text.UTF8Encoding($false)))
        throw 'Nao foi possivel preparar os componentes do aplicativo.'
    }

    Write-Host ''
    Write-Host 'Validando a versão completa...'
    $env:WRANGLER_LOG_PATH = '.wrangler/wrangler.log'
    $ErrorActionPreference = 'Continue'
    & $pnpm run build 2>&1 | Tee-Object -FilePath $logFile -Append
    $buildExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedErrorActionPreference
    if ($buildExitCode -ne 0) {
        [IO.File]::WriteAllText($statusFile, 'build_failed', (New-Object System.Text.UTF8Encoding($false)))
        throw 'A validacao encontrou um problema.'
    }

    if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory 'dist\server\index.js'))) {
        [IO.File]::WriteAllText($statusFile, 'output_missing', (New-Object System.Text.UTF8Encoding($false)))
        throw 'A versao final nao foi gerada.'
    }

    [IO.File]::WriteAllText($statusFile, 'success', (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ''
    Write-Host 'Versao validada e pronta para publicacao.' -ForegroundColor Green
    Write-Host 'Volte ao chat e escreva: Build concluido'
}
finally {
    Pop-Location
}
