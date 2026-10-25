[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Generating TypeScript types from the linked hosted Supabase project..."
$types = pnpm dlx supabase gen types typescript --linked --schema public
if ($LASTEXITCODE -ne 0) {
    throw "Type generation failed. Link a hosted project first: pnpm dlx supabase link --project-ref <ref>"
}

$types | Out-File -FilePath "packages/shared/src/database.ts" -Encoding utf8
Write-Host "Wrote packages/shared/src/database.ts"
