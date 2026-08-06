$ErrorActionPreference = 'Stop'

$expectedSource = 'C:\Users\taran\Documents\Codex\2026-08-04\quero-usar-esta-conversa-como-meu-2'
$source = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\')
$destinationParent = 'D:\Aplicativos'
$destination = 'D:\Aplicativos\Shaft'
$minimumFreeBytes = 5GB
$bundledPnpm = 'C:\Users\taran\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'

Write-Host ''
Write-Host 'Shaft - migracao segura para o disco D' -ForegroundColor DarkYellow
Write-Host ''

if (-not [string]::Equals($source, $expectedSource, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Origem inesperada: $source"
}

$sourceInfo = Get-Item -LiteralPath $source -Force
if (-not $sourceInfo.PSIsContainer -or ($sourceInfo.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw 'A pasta de origem nao e uma pasta comum e segura.'
}

$drive = [IO.DriveInfo]::new('D')
if (-not $drive.IsReady) {
    throw 'O disco D nao esta disponivel.'
}
if ($drive.AvailableFreeSpace -lt $minimumFreeBytes) {
    throw 'O disco D precisa ter pelo menos 5 GB livres.'
}

if (Test-Path -LiteralPath $destination) {
    $destinationInfo = Get-Item -LiteralPath $destination -Force
    if ($destinationInfo.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw 'O destino existente e um link ou ponto de nova analise.'
    }
    throw "O destino ja existe. Nada foi sobrescrito: $destination"
}

if (Test-Path -LiteralPath $destinationParent) {
    $parentInfo = Get-Item -LiteralPath $destinationParent -Force
    if (-not $parentInfo.PSIsContainer -or ($parentInfo.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw 'D:\Aplicativos existe, mas nao e uma pasta comum e segura.'
    }
}
else {
    New-Item -ItemType Directory -Path $destinationParent -ErrorAction Stop | Out-Null
}

$excludedNames = @(
    'node_modules',
    '.pnpm-store',
    'dist',
    '.next',
    '.vinext',
    '.wrangler',
    'outputs',
    'work'
)

$itemsToCopy = @(
    Get-ChildItem -LiteralPath $source -Force -ErrorAction Stop |
        Where-Object { $excludedNames -notcontains $_.Name }
)

foreach ($item in $itemsToCopy) {
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Foi encontrado um link na origem: $($item.FullName)"
    }
    if ($item.PSIsContainer) {
        $nestedLink = Get-ChildItem -LiteralPath $item.FullName -Force -Recurse -ErrorAction Stop |
            Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint } |
            Select-Object -First 1
        if ($nestedLink) {
            throw "Foi encontrado um link dentro da origem: $($nestedLink.FullName)"
        }
    }
}

$staging = Join-Path $destinationParent ('Shaft.migrando-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging -ErrorAction Stop | Out-Null

Write-Host 'Copiando os arquivos essenciais do aplicativo...'
try {
    foreach ($item in $itemsToCopy) {
        Copy-Item -LiteralPath $item.FullName -Destination $staging -Recurse -Force -ErrorAction Stop
    }

    if (-not (Test-Path -LiteralPath (Join-Path $staging 'package.json'))) {
        throw 'A copia nao contem package.json.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $staging 'app\ShaftApp.tsx'))) {
        throw 'A copia nao contem o aplicativo principal.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $staging '.env.local'))) {
        throw 'A configuracao privada do Notion nao foi copiada.'
    }

    Move-Item -LiteralPath $staging -Destination $destination -ErrorAction Stop
}
catch {
    Write-Host ''
    Write-Host "A copia parcial foi preservada para inspecao em: $staging" -ForegroundColor Yellow
    throw
}

Write-Host "Arquivos copiados para: $destination" -ForegroundColor Green

if (-not (Test-Path -LiteralPath $bundledPnpm)) {
    throw 'O preparador de dependencias do Codex nao foi encontrado.'
}

$workDirectory = Join-Path $destination 'work'
$statusFile = Join-Path $workDirectory 'migration-build-status.txt'
$logFile = Join-Path $workDirectory 'migration-build.log'
New-Item -ItemType Directory -Path $workDirectory -Force | Out-Null
[IO.File]::WriteAllText($statusFile, 'installing', (New-Object Text.UTF8Encoding($false)))
[IO.File]::WriteAllText($logFile, '', (New-Object Text.UTF8Encoding($false)))

Push-Location $destination
try {
    $env:CI = 'true'
    Write-Host ''
    Write-Host 'Instalando os componentes no disco D...'
    & $bundledPnpm install --no-frozen-lockfile 2>&1 | Tee-Object -FilePath $logFile -Append
    if ($LASTEXITCODE -ne 0) {
        [IO.File]::WriteAllText($statusFile, 'install_failed', (New-Object Text.UTF8Encoding($false)))
        throw 'Os arquivos foram migrados, mas a instalacao nao terminou.'
    }

    [IO.File]::WriteAllText($statusFile, 'building', (New-Object Text.UTF8Encoding($false)))
    Write-Host ''
    Write-Host 'Validando o aplicativo no disco D...'
    $env:WRANGLER_LOG_PATH = '.wrangler/wrangler.log'
    & $bundledPnpm run build 2>&1 | Tee-Object -FilePath $logFile -Append
    if ($LASTEXITCODE -ne 0) {
        [IO.File]::WriteAllText($statusFile, 'build_failed', (New-Object Text.UTF8Encoding($false)))
        throw 'Os arquivos foram migrados, mas a validacao encontrou um problema.'
    }

    if (-not (Test-Path -LiteralPath (Join-Path $destination 'dist\server\index.js'))) {
        [IO.File]::WriteAllText($statusFile, 'output_missing', (New-Object Text.UTF8Encoding($false)))
        throw 'A versao final nao foi gerada no disco D.'
    }

    [IO.File]::WriteAllText($statusFile, 'success', (New-Object Text.UTF8Encoding($false)))
    Write-Host ''
    Write-Host 'Migracao e validacao concluidas.' -ForegroundColor Green
    Write-Host 'Abra D:\Aplicativos\Shaft no Codex para continuar a publicacao.'
}
finally {
    Pop-Location
}
