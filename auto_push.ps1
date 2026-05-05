# ============================================================
#  auto_push.ps1   v1.1
#  ------------------------------------------------------------
#  Auto-commit and push current folder to GitHub.
#  Pair with manual_push.bat - double click .bat to run.
#
#  Optimizations vs v1.0:
#    * Pure ASCII (avoids Windows PowerShell 5.1 encoding issues)
#    * Detect missing git user.name / user.email and auto-fix
#    * Auto-retry push with --set-upstream on first push
#    * Auto pull --rebase if remote has newer commits
#    * Skip empty commits cleanly
#    * Color-coded console output
#    * Full log to push_log.txt
#
#  GitHub Actions (.github/workflows/deploy.yml) deploys to:
#    https://zway-education.github.io/mindspectrum-email/
# ============================================================

$ErrorActionPreference = "Continue"

# UTF-8 console output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding           = [System.Text.Encoding]::UTF8

# Log file
$logFile = Join-Path $PSScriptRoot "push_log.txt"

function Write-Log {
    param(
        [string]$msg,
        [string]$color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line     = "[$timestamp] $msg"
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

function Write-Ok    { param([string]$m) Write-Log "[OK] $m" "Green"  }
function Write-Warn  { param([string]$m) Write-Log "[!]  $m" "Yellow" }
function Write-Err   { param([string]$m) Write-Log "[X]  $m" "Red"    }
function Write-Info  { param([string]$m) Write-Log "     $m" "Gray"   }
function Write-Step  { param([string]$m) Write-Log "->   $m" "Cyan"   }

# ------------------------------------------------------------
#  Begin
# ------------------------------------------------------------
Set-Location $PSScriptRoot
Write-Log "============================================="
Write-Log "Auto Push Start"
Write-Info "Working dir : $PSScriptRoot"

# --- 1. Check git installed --------------------------------
$gitVer = git --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Err "git is not installed or not in PATH."
    Write-Info "Install Git for Windows: https://git-scm.com/download/win"
    exit 1
}
Write-Info "Git version : $gitVer"

# --- 2. Check git repo --------------------------------------
git rev-parse --git-dir 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Err "This folder is not a git repository."
    Write-Info "Run 'git init' or 'git clone <repo>' first."
    exit 1
}

# --- 3. Verify git user identity (auto-fix) ----------------
$userName  = git config user.name 2>$null
$userEmail = git config user.email 2>$null
if ([string]::IsNullOrWhiteSpace($userName) -or [string]::IsNullOrWhiteSpace($userEmail)) {
    Write-Warn "git user.name / user.email not set. Setting defaults..."
    if ([string]::IsNullOrWhiteSpace($userName)) {
        git config user.name "auto-push" | Out-Null
        Write-Info "Set user.name  = auto-push"
    }
    if ([string]::IsNullOrWhiteSpace($userEmail)) {
        git config user.email "auto-push@local" | Out-Null
        Write-Info "Set user.email = auto-push@local"
    }
} else {
    Write-Info "Git user    : $userName <$userEmail>"
}

# --- 4. Show branch -----------------------------------------
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if ([string]::IsNullOrWhiteSpace($branch) -or $branch -eq "HEAD") {
    Write-Err "Cannot determine current branch (detached HEAD?)"
    exit 1
}
Write-Info "Branch      : $branch"

# --- 5. Check changes ---------------------------------------
$status = git status --porcelain
if (-not $status) {
    Write-Ok "No local changes. Working tree clean."
    Write-Info "Will still attempt push in case local commits are ahead..."
} else {
    Write-Info "Detected changes:"
    $status -split "`n" | ForEach-Object { Write-Info "  $_" }

    # --- 5a. git add ---
    Write-Step "git add ."
    git add . 2>&1 | ForEach-Object { Write-Info "  $_" }
    if ($LASTEXITCODE -ne 0) { Write-Err "git add failed."; exit 1 }

    # --- 5b. git commit ---
    $commitTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMsg       = "auto-push: $commitTimestamp"
    Write-Step "git commit -m `"$commitMsg`""
    git commit -m $commitMsg 2>&1 | ForEach-Object { Write-Info "  $_" }
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Nothing committed (no staged changes after add?)"
    }
}

# --- 6. Try push (with auto-retry on common failures) -------
Write-Step "git push origin $branch"
$pushOutput = git push origin $branch 2>&1
$pushOutput | ForEach-Object { Write-Info "  $_" }
$pushExit = $LASTEXITCODE

if ($pushExit -ne 0) {
    $combined = ($pushOutput -join "`n")

    if ($combined -match "no upstream branch" -or $combined -match "set the remote as upstream") {
        Write-Warn "No upstream set. Retrying with --set-upstream..."
        Write-Step "git push --set-upstream origin $branch"
        git push --set-upstream origin $branch 2>&1 | ForEach-Object { Write-Info "  $_" }
        $pushExit = $LASTEXITCODE
    }
    elseif ($combined -match "rejected" -and $combined -match "non-fast-forward") {
        Write-Warn "Remote has newer commits. Trying pull --rebase..."
        Write-Step "git pull --rebase origin $branch"
        git pull --rebase origin $branch 2>&1 | ForEach-Object { Write-Info "  $_" }
        if ($LASTEXITCODE -eq 0) {
            Write-Step "git push origin $branch (retry)"
            git push origin $branch 2>&1 | ForEach-Object { Write-Info "  $_" }
            $pushExit = $LASTEXITCODE
        } else {
            Write-Err "pull --rebase failed. May have conflicts - resolve manually."
        }
    }
}

if ($pushExit -ne 0) {
    Write-Err "Push failed (exit $pushExit)"
    Write-Info "Possible causes:"
    Write-Info "  1. Network issue - check internet connection"
    Write-Info "  2. No push permission - check SSH key or Personal Access Token"
    Write-Info "  3. Authentication required - try a manual 'git push' once first"
    Write-Info "  4. Merge conflict from rebase - resolve manually then re-run"
    exit 1
}

# --- 7. Done ------------------------------------------------
Write-Ok "Push complete!"
Write-Info "GitHub Actions will start auto-deploy in ~30s."
Write-Info "Site URL : https://zway-education.github.io/mindspectrum-email/"
Write-Info "Workflow : https://github.com/zway-education/mindspectrum-email/actions"
Write-Log "End."
Write-Log ""
