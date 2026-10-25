[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# See bootstrap.ps1: pip-installed uv is often missing from PATH. Fall back to the module form
# (`python -m uv`) used throughout HANDOFF.md, then fail with an actionable message.
$uv = $null
if (Get-Command "uv" -ErrorAction SilentlyContinue) {
    $uv = { param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments) & uv @Arguments }
} else {
    python -m uv --version *> $null
    if ($LASTEXITCODE -eq 0) {
        $uv = { param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments) & python -m uv @Arguments }
    }
}
if (-not $uv) {
    throw "uv is required. Install it with: python -m pip install --user uv"
}

function Invoke-Step {
    param([string]$Name, [scriptblock]$Action)

    Write-Host ""
    Write-Host "== $Name =="
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

Invoke-Step -Name "typecheck" -Action { pnpm typecheck }
Invoke-Step -Name "lint" -Action { pnpm lint }
Invoke-Step -Name "sql" -Action { pnpm db:verify }

$env:SKIP_ENV_VALIDATION = "1"
try {
    Invoke-Step -Name "build" -Action { pnpm build }
}
finally {
    Remove-Item Env:SKIP_ENV_VALIDATION -ErrorAction SilentlyContinue
}

Push-Location "apps/worker"
try {
    Invoke-Step -Name "ruff" -Action { & $uv run ruff check . }
    Invoke-Step -Name "ruff format" -Action { & $uv run ruff format --check . }
    Invoke-Step -Name "mypy" -Action { & $uv run mypy clipmax_worker }
    Invoke-Step -Name "pytest" -Action { & $uv run pytest }
}
finally {
    Pop-Location
}

if (-not (Get-Command "ffmpeg" -ErrorAction SilentlyContinue)) {
    throw "FFmpeg is required by the worker. Install it with: winget install Gyan.FFmpeg"
}

Invoke-Step -Name "ffmpeg" -Action { ffmpeg -version | Select-Object -First 1 }

Write-Host ""
Write-Host "All checks passed."
