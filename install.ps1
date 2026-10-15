param(
    [switch]$Global,
    [switch]$Local,
    [string]$Prefix,
    [switch]$DryRun,
    [switch]$Help,
    [string]$Package
)

$script = Join-Path $PSScriptRoot 'scripts/install.js'
$arguments = @()

if ($Help) {
    $arguments += '--help'
}

if ($Global) {
    $arguments += '--global'
}

if ($Local) {
    $arguments += '--local'
}

if ($Prefix) {
    $arguments += '--prefix'
    $arguments += $Prefix
}

if ($DryRun) {
    $arguments += '--dry-run'
}

if ($Package) {
    $arguments += '--package'
    $arguments += $Package
}

& node $script @arguments
exit $LASTEXITCODE
