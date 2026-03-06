$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendPath = Join-Path $root "backend"
$envPath = Join-Path $backendPath ".env"
$exampleEnvPath = Join-Path $backendPath ".env.example"

if (-not (Test-Path (Join-Path $backendPath "artisan"))) {
    throw "Laravel backend not found at: $backendPath"
}

if (-not (Test-Path $envPath)) {
    if (-not (Test-Path $exampleEnvPath)) {
        throw "Missing backend .env and .env.example files."
    }
    Copy-Item $exampleEnvPath $envPath
}

function Set-EnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Key,
        [Parameter(Mandatory = $true)][string]$Value
    )

    $content = Get-Content -Path $Path
    $pattern = "^" + [regex]::Escape($Key) + "="
    $replacement = "$Key=$Value"
    $updated = $false

    for ($i = 0; $i -lt $content.Count; $i++) {
        if ($content[$i] -match $pattern) {
            $content[$i] = $replacement
            $updated = $true
            break
        }
    }

    if (-not $updated) {
        $content += $replacement
    }

    Set-Content -Path $Path -Value $content
}

function Invoke-Artisan {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & php artisan @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "php artisan $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

Set-Location $backendPath

Write-Host "Using Laravel backend at: $backendPath"
Write-Host "Ensuring MySQL connection points to database: coffee_preylang"

Set-EnvValue -Path $envPath -Key "DB_CONNECTION" -Value "mysql"
Set-EnvValue -Path $envPath -Key "DB_HOST" -Value "127.0.0.1"
Set-EnvValue -Path $envPath -Key "DB_PORT" -Value "3306"
Set-EnvValue -Path $envPath -Key "DB_DATABASE" -Value "coffee_preylang"

Invoke-Artisan -Arguments @("config:clear")
Invoke-Artisan -Arguments @("migrate", "--force")
Invoke-Artisan -Arguments @("db:seed", "--force")
Invoke-Artisan -Arguments @("migrate:status")
Invoke-Artisan -Arguments @("optimize:clear")

Write-Host ""
Write-Host "MySQL setup completed."
Write-Host "Database: coffee_preylang"
Write-Host "Your data persists in MySQL unless you run destructive commands (migrate:fresh/db:wipe)."
