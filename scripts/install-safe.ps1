# npm postinstall breaks when the repo path contains "&" (e.g. CRAVE & CONQUER).
# Maps a drive letter and runs npm install from there.

param(
    [string]$Drive = "S:"
)

$RepoRoot = Split-Path -Parent $PSScriptRoot

if (Test-Path "${Drive}\") {
    subst $Drive /d 2>$null
}

subst $Drive $RepoRoot
if (-not $?) {
    Write-Error "subst failed for $RepoRoot"
    exit 1
}

Push-Location "${Drive}\"
try {
    npm install @args
    exit $LASTEXITCODE
} finally {
    Pop-Location
}