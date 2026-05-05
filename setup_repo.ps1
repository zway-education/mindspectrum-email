# ============================================================
#  setup_repo.ps1   v1.2
#  ------------------------------------------------------------
#  v1.2 changes:
#    * Use 'git add -A -v' for verbose, aggressive staging
#    * Explicit verification that files were staged
#    * Better diagnostics on staging failure
# ============================================================

$ErrorActionPreference = "Continue"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding           = [System.Text.Encoding]::UTF8

$REPO_URL = "https://github.com/zway-education/mindspectrum-email.git"
$BRANCH   = "main"
$logFile  = Join-Path $PSScriptRoot "setup_log.txt"

function Write-Log {
    param([string]$msg, [string]$color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $msg"
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

function Step { param([string]$m) Write-Log "->   $m" "Cyan" }
function Ok   { param([string]$m) Write-Log "[OK] $m" "Green" }
function Warn { param([string]$m) Write-Log "[!]  $m" "Yellow" }
function Err  { param([string]$m) Write-Log "[X]  $m" "Red" }
function Info { param([string]$m) Write-Log "     $m" "Gray" }

Set-Location $PSScriptRoot
Write-Log "============================================="
Write-Log "Repo Setup Start (v1.2)"
Info "Folder    : $PSScriptRoot"
Info "Repo URL  : $REPO_URL"
Info "Branch    : $BRANCH"
Write-Log ""

# --- 1. Check git installed ---------------------------------
$gitVer = git --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Err "git is not installed."
    Info "Install Git for Windows: https://git-scm.com/download/win"
    exit 1
}
Info "Git: $gitVer"

# --- 2. Already a git repo? ---------------------------------
git rev-parse --git-dir 2>$null | Out-Null
$alreadyRepo = ($LASTEXITCODE -eq 0)
if ($alreadyRepo) {
    Warn "Already a git repository. Continuing with existing repo..."
    git remote -v 2>&1 | ForEach-Object { Info "  $_" }
} else {
    # --- 3. git init ----------------------------------------
    Step "git init"
    git init 2>&1 | ForEach-Object { Info "  $_" }
    if ($LASTEXITCODE -ne 0) { Err "git init failed."; exit 1 }

    # --- 4. Set branch name to main -------------------------
    Step "git branch -M $BRANCH"
    git branch -M $BRANCH 2>&1 | ForEach-Object { Info "  $_" }
}

# --- 5. Set local user.name/email if global missing --------
$gName  = git config --global user.name 2>$null
$gEmail = git config --global user.email 2>$null
$lName  = git config user.name 2>$null
$lEmail = git config user.email 2>$null
if ([string]::IsNullOrWhiteSpace($lName)) {
    if ([string]::IsNullOrWhiteSpace($gName)) {
        git config user.name "auto-push" | Out-Null
        Info "Set local user.name  = auto-push"
    }
}
if ([string]::IsNullOrWhiteSpace($lEmail)) {
    if ([string]::IsNullOrWhiteSpace($gEmail)) {
        git config user.email "auto-push@local" | Out-Null
        Info "Set local user.email = auto-push@local"
    }
}

# --- 6. Add remote (skip if already exists) -----------------
$existingRemote = git remote get-url origin 2>$null
if ([string]::IsNullOrWhiteSpace($existingRemote)) {
    Step "git remote add origin $REPO_URL"
    git remote add origin $REPO_URL 2>&1 | ForEach-Object { Info "  $_" }
} else {
    Info "Remote 'origin' already set: $existingRemote"
}

# --- 7. Fetch from remote -----------------------------------
Step "git fetch origin"
git fetch origin 2>&1 | ForEach-Object { Info "  $_" }
if ($LASTEXITCODE -ne 0) {
    Err "git fetch failed (exit $LASTEXITCODE)"
    Info "Possible causes: network / wrong URL / auth required"
    exit 1
}

# --- 8. Stage all local files (verbose, aggressive) --------
Step "git add -A -v"
git add -A -v 2>&1 | ForEach-Object { Info "  $_" }
if ($LASTEXITCODE -ne 0) {
    Err "git add failed (exit $LASTEXITCODE)"
    exit 1
}

# --- 8b. Verify staging actually happened -------------------
$stagedList = git diff --cached --name-only 2>&1
if ([string]::IsNullOrWhiteSpace($stagedList)) {
    Err "git add ran but NO files were staged."
    Info ""
    Info "This is usually caused by:"
    Info "  1. .gitignore excluding all files (check .gitignore content)"
    Info "  2. Path encoding issue with Chinese characters"
    Info "  3. core.autocrlf / safecrlf blocking everything"
    Info ""
    Info "Diagnostic info:"
    Info "  PWD: $((Get-Location).Path)"
    Info ""
    Info "  git status output:"
    git status 2>&1 | ForEach-Object { Info "    $_" }
    Info ""
    Info "  Files in folder:"
    Get-ChildItem -Force | ForEach-Object { Info "    $($_.Name)" }
    Info ""
    Info "Manual workaround - run these in PowerShell here:"
    Info "  git add --force ."
    Info "  git status"
    Info "  git commit -m `"manual: initial commit`""
    Info "  git push -u origin main --force"
    exit 1
}

$stagedCount = ($stagedList | Measure-Object -Line).Lines
Ok "Staged $stagedCount file(s):"
$stagedList -split "`n" | ForEach-Object { if ($_) { Info "  $_" } }

# --- 9. Initial commit --------------------------------------
$commitMsg = "Initial: import local files (setup_repo $(Get-Date -Format 'yyyy-MM-dd'))"
Step "git commit -m `"$commitMsg`""
git commit -m $commitMsg 2>&1 | ForEach-Object { Info "  $_" }
if ($LASTEXITCODE -ne 0) {
    Err "Initial commit failed (exit $LASTEXITCODE)"
    exit 1
}

# --- 10. Check remote main status ---------------------------
$remoteMain = git ls-remote --heads origin $BRANCH 2>$null

if ([string]::IsNullOrWhiteSpace($remoteMain)) {
    Info ""
    Info "Remote 'main' is empty. Doing simple push..."
    Step "git push -u origin $BRANCH"
    git push -u origin $BRANCH 2>&1 | ForEach-Object { Info "  $_" }
    if ($LASTEXITCODE -ne 0) {
        Err "Push failed."
        exit 1
    }
    Ok "Setup complete and first push done!"
} else {
    Info ""
    Info "Remote 'main' already has commits."
    Info "Trying to push your local files..."
    Step "git push -u origin $BRANCH"
    $pushOutput = git push -u origin $BRANCH 2>&1
    $pushOutput | ForEach-Object { Info "  $_" }

    if ($LASTEXITCODE -eq 0) {
        Ok "Push succeeded! Setup complete."
    } else {
        Write-Log ""
        Warn "Push rejected (remote has unrelated commits)."
        Info ""
        Info "============================================="
        Info "  PICK ONE TO RESOLVE - run in this folder:"
        Info "============================================="
        Info ""
        Info "OPTION A: Keep YOUR LOCAL files (overwrite remote)"
        Info "  Recommended - your local has the latest v1.07"
        Info ""
        Info "  Run this in PowerShell or cmd here:"
        Info "    git push -u origin main --force"
        Info ""
        Info "OPTION B: Keep REMOTE files (discard your local edits)"
        Info "  WARNING - your local v1.07 work will be overwritten!"
        Info ""
        Info "    git fetch origin"
        Info "    git reset --hard origin/main"
        Info ""
        Info "============================================="
        Info ""
        Info "After picking one, manual_push.bat will work normally."
    }
}

Write-Log "End."
Write-Log ""
