[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "apps/worker")

if (-not (Test-Path ".env") -and (Test-Path (Join-Path $root ".env"))) {
    Copy-Item (Join-Path $root ".env") ".env"
    Write-Host "Copied the root .env into apps/worker/.env"
}

# For WHISPER_PROVIDER=local, install the extra once:
#   uv sync --extra local-whisper
$uvArgs = @("run", "uvicorn", "clipmax_worker.service:app", "--reload", "--port", "8080")

if (Get-Command "uv" -ErrorAction SilentlyContinue) {
    & uv @uvArgs
} else {
    # pip-installed uv may not expose uv.exe on PATH; the module form is equivalent.
    python -m uv --version *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "uv is required. Install it with: python -m pip install --user uv"
    }
    & python -m uv @uvArgs
}

exit $LASTEXITCODE
