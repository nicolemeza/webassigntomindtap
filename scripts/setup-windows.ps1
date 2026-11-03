#requires -Version 7.2
$ErrorActionPreference = 'Stop'

# Repair a checkout whose tracked node_modules was installed on another OS.
# Read versions and integrity directly from the existing lockfile; do not resolve
# dependencies or change package.json/package-lock.json.
$projectRoot = Split-Path -Parent $PSScriptRoot
$lock = Get-Content -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Raw | ConvertFrom-Json -AsHashtable
$platform = & node -p 'process.platform + "-" + process.arch'
if ($LASTEXITCODE -ne 0 -or $platform -ne 'win32-x64') {
    throw 'This repair is intended for Windows x64 with Node available on PATH.'
}

$packagePaths = @(
    'node_modules/@rolldown/binding-win32-x64-msvc',
    'node_modules/lightningcss-win32-x64-msvc'
)
foreach ($packagePath in $packagePaths) {
    $entry = $lock.packages[$packagePath]
    if (-not $entry -or $entry.integrity -notmatch '^sha512-(.+)$') {
        throw "Missing SHA-512 lockfile entry for $packagePath"
    }
    $expectedHash = $Matches[1]
    $destination = Join-Path $projectRoot $packagePath
    if (Test-Path -LiteralPath $destination) {
        $installed = Get-Content -LiteralPath (Join-Path $destination 'package.json') -Raw | ConvertFrom-Json
        if ($installed.version -ne $entry.version) {
            throw "Existing $packagePath differs from the lockfile; refusing to overwrite it."
        }
        Write-Output "Already installed: $packagePath@$($entry.version)"
        continue
    }

    $downloadDir = Join-Path ([IO.Path]::GetTempPath()) ('mindtap-windows-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $downloadDir | Out-Null
    $archive = Join-Path $downloadDir 'package.tgz'
    Invoke-WebRequest -Uri $entry.resolved -OutFile $archive
    $actualHash = [Convert]::ToBase64String([Security.Cryptography.SHA512]::HashData([IO.File]::ReadAllBytes($archive)))
    if ($actualHash -ne $expectedHash) {
        throw "Integrity check failed for $packagePath; archive retained at $archive"
    }
    & tar.exe -xzf $archive -C $downloadDir
    if ($LASTEXITCODE -ne 0) { throw "Extraction failed for $archive" }
    $extracted = Join-Path $downloadDir 'package'
    $manifest = Get-Content -LiteralPath (Join-Path $extracted 'package.json') -Raw | ConvertFrom-Json
    if ($manifest.version -ne $entry.version -or $manifest.name -ne $packagePath.Substring(13)) {
        throw "Archive manifest does not match $packagePath@$($entry.version)"
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Move-Item -LiteralPath $extracted -Destination $destination
    # Delete only the archive downloaded by this invocation, leaving no recursive cleanup.
    Remove-Item -LiteralPath $archive
    Remove-Item -LiteralPath $downloadDir
    Write-Output "Installed: $packagePath@$($entry.version) (SHA-512 verified)"
}

# Preserve the tracked Unix launchers and add Windows launchers alongside them.
$binDir = Join-Path $projectRoot 'node_modules/.bin'
foreach ($launcher in Get-ChildItem -LiteralPath $binDir -File) {
    if ($launcher.Extension -in @('.cmd', '.ps1')) { continue }
    $target = (Get-Content -LiteralPath $launcher.FullName -Raw).Trim()
    if ($target -notmatch '^\.\./[^\r\n]+$') { continue }
    $targetPath = Join-Path $binDir $target
    if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) { continue }
    if ((Get-Content -LiteralPath $targetPath -TotalCount 1) -notmatch '^#!.*\bnode\b') { continue }
    $windowsTarget = $target.Replace('/', '\')
    $contents = "@echo off`r`nnode `"%~dp0$windowsTarget`" %*`r`nexit /b %ERRORLEVEL%`r`n"
    $cmdPath = $launcher.FullName + '.cmd'
    if ((Test-Path -LiteralPath $cmdPath) -and (Get-Content -LiteralPath $cmdPath -Raw) -eq $contents) { continue }
    [IO.File]::WriteAllText($cmdPath, $contents, [Text.UTF8Encoding]::new($false))
    Write-Output "Created: node_modules/.bin/$($launcher.Name).cmd"
}

& node -e 'require("@rolldown/binding-win32-x64-msvc"); require("lightningcss"); console.log("Windows native dependencies load successfully.")'
if ($LASTEXITCODE -ne 0) { throw 'Windows native dependency load check failed.' }
