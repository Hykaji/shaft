$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectDirectory '.env.local'
$statusDirectory = Join-Path $projectDirectory 'work'
$statusFile = Join-Path $statusDirectory 'notion-connection-status.txt'

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
$body = @{ page_size = 1 } | ConvertTo-Json -Compress
$sourceId = 'e389f37d-3d89-4075-ac23-6bb73e88733a'

Write-Host ''
Write-Host 'Shaft - teste de leitura do Notion' -ForegroundColor DarkYellow
Write-Host 'Consultando a base Atividades sem alterar dados...'

try {
    $result = Invoke-RestMethod -Method Post -Uri "https://api.notion.com/v1/data_sources/$sourceId/query" -Headers $headers -Body $body -TimeoutSec 25
    if ($result.object -ne 'list') {
        throw 'O Notion retornou uma resposta inesperada.'
    }

    New-Item -ItemType Directory -Path $statusDirectory -Force | Out-Null
    [IO.File]::WriteAllText($statusFile, 'success', (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ''
    Write-Host 'Conexão confirmada. A leitura do Notion está funcionando.' -ForegroundColor Green
    Write-Host 'Volte ao chat e escreva: Teste concluído'
}
catch {
    $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    $friendlyMessage = switch ($statusCode) {
        401 { 'O token foi recusado. Copie novamente o Installation access token.' }
        403 { 'Ative a permissão Read content na integração.' }
        404 { 'Adicione Shaft · 2026 em Content access.' }
        429 { 'O Notion pediu uma pausa. Aguarde um minuto e tente novamente.' }
        default { 'Não foi possível alcançar o Notion. Verifique sua internet e tente novamente.' }
    }
    New-Item -ItemType Directory -Path $statusDirectory -Force | Out-Null
    [IO.File]::WriteAllText($statusFile, "error:$statusCode", (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ''
    Write-Host $friendlyMessage -ForegroundColor Red
}
finally {
    $notionToken = $null
    $headers = $null
}
