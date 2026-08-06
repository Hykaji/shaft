$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectDirectory '.env.local'

Write-Host ''
Write-Host 'Shaft - conexão segura com o Notion' -ForegroundColor DarkYellow
Write-Host 'O token não será exibido e ficará somente neste computador.'
Write-Host ''

if (Test-Path -LiteralPath $environmentFile) {
    Write-Host 'A configuração anterior será substituída.' -ForegroundColor DarkYellow
}

Write-Host '1. Volte ao Notion e copie o token.'
Write-Host '2. Retorne a esta janela sem colar o token aqui.'
Read-Host '3. Com o token copiado, pressione apenas Enter' | Out-Null

try {
    $plainToken = Get-Clipboard -Raw
    $plainToken = $plainToken.Trim()

    if ([string]::IsNullOrWhiteSpace($plainToken)) {
        throw 'A área de transferência está vazia.'
    }
    if ($plainToken -match '[\x00-\x20\x7F]') {
        throw 'O token informado tem um formato inesperado.'
    }

    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($environmentFile, "NOTION_API_KEY=$plainToken`n", $utf8WithoutBom)
}
finally {
    Set-Clipboard -Value ''
    $plainToken = $null
}

Write-Host ''
Write-Host 'Conexão salva com segurança.' -ForegroundColor Green
Write-Host 'Volte ao chat e escreva: Token configurado'
