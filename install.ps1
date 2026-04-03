#Requires -Version 5.1
<#
.SYNOPSIS
    VOID Player — One-Click Install Script for Windows
.DESCRIPTION
    Downloads and installs the latest VOID Player release for Windows,
    or opens the PWA in the default browser as a fallback.
.EXAMPLE
    # Run from PowerShell (Admin or user):
    irm https://raw.githubusercontent.com/anacondy/Void-player-/main/install.ps1 | iex
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Repo       = "anacondy/Void-player-"
$PwaUrl     = "https://anacondy.github.io/Void-player-/"
$ApiUrl     = "https://api.github.com/repos/$Repo/releases/latest"
$InstallDir = Join-Path $env:LOCALAPPDATA "VoidPlayer"

# ── Banner ────────────────────────────────────────────────────
Write-Host ""
Write-Host " ██╗   ██╗ ██████╗ ██╗██████╗ " -ForegroundColor Cyan
Write-Host " ██║   ██║██╔═══██╗██║██╔══██╗" -ForegroundColor Cyan
Write-Host " ██║   ██║██║   ██║██║██║  ██║" -ForegroundColor Cyan
Write-Host " ╚██╗ ██╔╝██║   ██║██║██║  ██║" -ForegroundColor Cyan
Write-Host "  ╚████╔╝ ╚██████╔╝██║██████╔╝" -ForegroundColor Cyan
Write-Host "   ╚═══╝   ╚═════╝ ╚═╝╚═════╝ " -ForegroundColor Cyan
Write-Host "          P L A Y E R          " -ForegroundColor Cyan
Write-Host ""

function Write-Info    { param($msg) Write-Host "[VOID] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[VOID] $msg" -ForegroundColor Green }
function Write-Warn    { param($msg) Write-Host "[VOID] $msg" -ForegroundColor Yellow }
function Write-Err     { param($msg) Write-Host "[VOID ERROR] $msg" -ForegroundColor Red }

# ── Resolve latest release ────────────────────────────────────
Write-Info "Fetching latest release information..."
try {
    $headers = @{ 'User-Agent' = 'void-player-installer' }
    $release = Invoke-RestMethod -Uri $ApiUrl -Headers $headers -TimeoutSec 15
    $tag     = $release.tag_name
    Write-Info "Latest release: $tag"
}
catch {
    Write-Warn "Could not reach GitHub API. Falling back to PWA install."
    $tag = $null
}

# ── Try downloading the Windows installer ─────────────────────
$installed = $false
if ($tag) {
    $installerName = "void-player_${tag}_x64-setup.exe"
    $downloadUrl   = "https://github.com/$Repo/releases/download/$tag/$installerName"
    $tmpDir        = Join-Path $env:TEMP "void-player-install"
    $installerPath = Join-Path $tmpDir $installerName

    New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

    Write-Info "Downloading $installerName..."
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -TimeoutSec 120
        $ProgressPreference = 'Continue'

        Write-Info "Running installer..."
        $proc = Start-Process -FilePath $installerPath -ArgumentList '/S' -Wait -PassThru
        if ($proc.ExitCode -eq 0) {
            Write-Success "VOID Player installed successfully."
            $installed = $true
        }
        else {
            Write-Warn "Installer exited with code $($proc.ExitCode). Trying NSIS silent mode..."
            $proc2 = Start-Process -FilePath $installerPath -ArgumentList '/SILENT' -Wait -PassThru
            if ($proc2.ExitCode -eq 0) {
                Write-Success "VOID Player installed successfully."
                $installed = $true
            }
        }
    }
    catch {
        Write-Warn "Could not download Windows installer: $_"
    }
    finally {
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $tmpDir
    }
}

# ── PWA fallback ──────────────────────────────────────────────
if (-not $installed) {
    Write-Warn "Desktop installer not available — opening PWA in your browser."
    Write-Info "In Chrome/Edge: click the install icon (⊕) in the address bar to install VOID Player as an app."
    try {
        Start-Process $PwaUrl
    }
    catch {
        Write-Err "Could not open browser automatically."
        Write-Info "Please open $PwaUrl in Chrome or Edge."
    }
}

# ── Desktop shortcut ──────────────────────────────────────────
if ($installed) {
    $exePath = Get-ChildItem -Path "C:\Program Files\VoidPlayer", "${env:LOCALAPPDATA}\VoidPlayer" `
                             -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue |
               Select-Object -First 1 -ExpandProperty FullName

    if ($exePath) {
        $desktop = [Environment]::GetFolderPath("Desktop")
        $shortcut = Join-Path $desktop "VOID Player.lnk"
        $wsh = New-Object -ComObject WScript.Shell
        $link = $wsh.CreateShortcut($shortcut)
        $link.TargetPath = $exePath
        $link.Description = "VOID Player — Privacy-focused music player"
        $link.Save()
        Write-Success "Desktop shortcut created."
    }
}

Write-Host ""
Write-Success "Done! Supported formats: MP3 · FLAC · WAV · AAC · M4A · OGG · OPUS · WebM"
Write-Info   "PWA: $PwaUrl"
