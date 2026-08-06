$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectDirectory '.env.local'
$statusDirectory = Join-Path $projectDirectory 'work'
$statusFile = Join-Path $statusDirectory 'notion-write-status.txt'
$parentPageId = '3b2f65ea-97b0-804b-86be-fa78f9f63139'
$createdPageId = $null

if (-not (Test-Path -LiteralPath $environmentFile)) {
    throw 'Configuração não encontrada. Execute configurar-notion.cmd primeiro.'
}

$entry = (Get-Content -LiteralPath $environmentFile -Raw).Trim()
if (-not $entry.StartsWith('NOTION_API_KEY=')) {
    throw 'A configuração local está inválida.'
}

$notionToken = $entry.Substring('NOTION_API_KEY='.Length)
$headers = @{
    Authorization = "Bearer $notionToken"
    'Notion-Version' = '2026-03-11'
    'Content-Type' = 'application/json'
}

$createBody = @{
    parent = @{ page_id = $parentPageId }
    properties = @{
        title = @{
            title = @(
                @{
                    type = 'text'
                    text = @{ content = 'Teste temporário · Modo Eixo App' }
                }
            )
        }
    }
} | ConvertTo-Json -Depth 8 -Compress

Write-Host ''
Write-Host 'Modo Eixo - teste controlado de escrita' -ForegroundColor DarkYellow
Write-Host 'Será criada uma página temporária e enviada imediatamente para a lixeira.'

try {
    $createdPage = Invoke-RestMethod -Method Post -Uri 'https://api.notion.com/v1/pages' -Headers $headers -Body $createBody -TimeoutSec 25
    if ($createdPage.object -ne 'page' -or [string]::IsNullOrWhiteSpace($createdPage.id)) {
        throw 'O Notion não confirmou a criação da página temporária.'
    }
    $createdPageId = $createdPage.id

    $removedPage = Invoke-RestMethod -Method Delete -Uri "https://api.notion.com/v1/blocks/$createdPageId" -Headers $headers -TimeoutSec 25
    if (-not $removedPage.in_trash) {
        throw 'A página temporária foi criada, mas o Notion não confirmou seu envio para a lixeira.'
    }

    New-Item -ItemType Directory -Path $statusDirectory -Force | Out-Null
    [IO.File]::WriteAllText($statusFile, 'success', (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ''
    Write-Host 'Escrita confirmada e página temporária removida.' -ForegroundColor Green
    Write-Host 'Volte ao chat e escreva: Escrita testada'
}
catch {
    $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    $cleanupState = if ($createdPageId) { 'cleanup_required' } else { 'nothing_created' }
    New-Item -ItemType Directory -Path $statusDirectory -Force | Out-Null
    [IO.File]::WriteAllText($statusFile, "error:${statusCode}:$cleanupState", (New-Object System.Text.UTF8Encoding($false)))

    Write-Host ''
    if ($createdPageId) {
        Write-Host 'A página temporária foi criada, mas não pôde ser removida. Não tente novamente.' -ForegroundColor Red
        Write-Host 'Volte ao chat e escreva: Falha ao limpar teste'
    }
    elseif ($statusCode -eq 403) {
        Write-Host 'A integração ainda não possui Insert content e Update content.' -ForegroundColor Red
    }
    elseif ($statusCode -eq 404) {
        Write-Host 'A página Modo Eixo · 2026 não está disponível para esta integração.' -ForegroundColor Red
    }
    else {
        Write-Host 'A escrita não pôde ser testada. Nenhuma página foi criada.' -ForegroundColor Red
    }
}
finally {
    $notionToken = $null
    $headers = $null
}
