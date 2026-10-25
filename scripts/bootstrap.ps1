[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Assert-Command {
    param([string]$Name, [string]$Hint)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing '$Name'. $Hint"
    }
}

Assert-Command -Name "node" -Hint "Install Node.js 24 from https://nodejs.org"
Assert-Command -Name "pnpm" -Hint "Run: corepack enable"
Assert-Command -Name "python" -Hint "Install Python 3.12"

# uv installed with pip lives in the per-user Scripts directory, which is not
# always on PATH in a fresh shell. Add it for this session when needed.
if (-not (Get-Command "uv" -ErrorAction SilentlyContinue)) {
    try {
        $scriptsDir = python -c "import sysconfig; print(sysconfig.get_path('scripts'))" 2>$null
        if ($LASTEXITCODE -eq 0 -and $scriptsDir -and (Test-Path (Join-Path $scriptsDir "uv.exe"))) {
            $env:PATH = "$scriptsDir;$env:PATH"
        }
    } catch {
        # Assert-Command below produces the actionable error.
    }
}

Assert-Command -Name "uv" -Hint "Run: python -m pip install --user uv"
Assert-Command -Name "ffmpeg" -Hint "Install FFmpeg with: winget install Gyan.FFmpeg"

$nodeMajor = [int]((node --version).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 22) {
    throw "Node 22 or newer is required (found $nodeMajor)."
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from the template. Fill in credentials before running the worker."
}

if (-not (Test-Path "apps/web/.env.local")) {
    Copy-Item "apps/web/.env.example" "apps/web/.env.local"
    Write-Host "Created apps/web/.env.local from the template."
}

Write-Host "Installing JavaScript dependencies..."
pnpm install

Write-Host "Syncing Python environment..."
Push-Location "apps/worker"
try {
    uv sync --group dev
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Bootstrap complete."
Write-Host "  pnpm dev              # web on http://localhost:3000"
Write-Host "  ./scripts/dev-worker.ps1"
