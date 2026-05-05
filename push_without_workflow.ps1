# ============================================================
#  push_without_workflow.ps1
#  ------------------------------------------------------------
#  Workaround for "PAT without workflow scope" GitHub error.
#  Removes .github/workflows/deploy.yml from the commit history,
#  then force pushes everything else.
# ============================================================

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding           = [System.Text.Encoding]::UTF8

$BRANCH = "main"

function Step { param([string]$m) Write-Host "->   $m" -ForegroundColor Cyan }
function Ok   { param([string]$m) Write-Host "[OK] $m" -ForegroundColor Green }
function Warn { param([string]$m) Write-Host "[!]  $m" -ForegroundColor Yellow }
function Err  { param([string]$m) Write-Host "[X]  $m" -ForegroundColor Red }
function Info { param([string]$m) Write-Host "     $m" -ForegroundColor Gray }

Set-Location $PSScriptRoot
Write-Host "============================================="
Write-Host "Push Without Workflow Start"
Info "Folder : $PSScriptRoot"
Write-Host ""

# --- 1. Verify git repo -------------------------------------
git rev-parse --git-dir 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Err "Not a git repo. Run setup_repo.bat first."; exit 1 }

# --- 2. Add workflow path to .git/info/exclude --------------
# This makes git ignore the workflow path locally without affecting .gitignore
$excludeFile = ".git/info/exclude"
$excludeLine = ".github/workflows/"
if (Test-Path $excludeFile) {
    $existing = Get-Content $excludeFile -ErrorAction SilentlyContinue
    if ($existing -notcontains $excludeLine) {
        Add-Content $excludeFile $excludeLine
        Info "Added '$excludeLine' to .git/info/exclude"
    }
}

# --- 3. Remove workflow file from index (keep local copy) ---
Step "git rm --cached -r .github/workflows/"
git rm --cached -r .github/workflows/ 2>&1 | ForEach-Object { Info "  $_" }
# It's OK if this errors (file might not be tracked yet)

# --- 4. Stage all OTHER changes -----------------------------
Step "git add -A"
git add -A 2>&1 | ForEach-Object { Info "  $_" }

# --- 5. Amend last commit (or create new if none) ----------
$hasCommits = git log -1 --oneline 2>$null
if ([string]::IsNullOrWhiteSpace($hasCommits)) {
    # No commits yet - create initial
    Step "git commit -m `"Initial: import (without workflow)`""
    git commit -m "Initial: import (without workflow file - add via web UI later)" 2>&1 | ForEach-Object { Info "  $_" }
} else {
    Step "git commit --amend --no-edit (re-commit without workflow)"
    git commit --amend --no-edit --allow-empty 2>&1 | ForEach-Object { Info "  $_" }
}
if ($LASTEXITCODE -ne 0) { Err "Commit failed."; exit 1 }

# --- 6. Force push ------------------------------------------
Step "git push -u origin $BRANCH --force"
git push -u origin $BRANCH --force 2>&1 | ForEach-Object { Info "  $_" }
$pushExit = $LASTEXITCODE

if ($pushExit -ne 0) {
    Err "Push still failed (exit $pushExit)"
    Info "Check the error message above. If it's about authentication,"
    Info "Windows may need to prompt you for GitHub login again."
    exit 1
}

# --- 7. Done ------------------------------------------------
Write-Host ""
Ok "Push complete!"
Write-Host ""
Info "What's pushed to GitHub:"
Info "  - index.html, Code.gs, README.md, all other files"
Info "  - .gitignore"
Info ""
Info "What's NOT pushed (still on your local computer):"
Info "  - .github/workflows/deploy.yml"
Info ""
Info "============================================================"
Info "  TO ENABLE AUTO-DEPLOY (one-time, on GitHub website):"
Info "============================================================"
Info "  1. Open https://github.com/zway-education/mindspectrum-email"
Info "  2. Click 'Add file' -> 'Create new file'"
Info "  3. Filename: .github/workflows/deploy.yml"
Info "  4. Paste the content from your local deploy.yml"
Info "  5. Commit directly to main"
Info ""
Info "OR upgrade your PAT to include 'workflow' scope:"
Info "  https://github.com/settings/tokens"
Info "  -> Edit your token -> check 'workflow' -> Update"
Info "  Then run manual_push.bat normally."
Write-Host ""
