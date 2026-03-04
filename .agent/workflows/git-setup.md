---
description: how to initialize git and handle SSO authentication
---

# Git & SSO Setup Workflow

This workflow guides the process of initializing a Git repository and connecting it to a remote server using SSO (Single Sign-On).

## 1. Local Initialization
// turbo
Check if the current directory is a Git repository.
```powershell
git status
```
If not initialized:
```powershell
git init
```

## 2. Configure Identity
// turbo
Set the local user name and email.
```powershell
git config user.name "YOUR_NAME"
git config user.email "YOUR_EMAIL"
```

## 3. Remote Connection
Add the remote repository URL.
```powershell
git remote add origin https://github.com/USER/REPO.git
```

## 4. SSO Authentication
To handle SSO, use the Git Credential Manager or GitHub CLI.

### Option A: GitHub CLI (Recommended)
If using GitHub, installing `gh` simplifies SSO.
// turbo
Check if `gh` is installed.
```powershell
gh --version
```
If not installed, install via Winget:
```powershell
winget install GitHub.cli
```
Then login with SSO:
```powershell
gh auth login --with-sso
```

### Option B: Git Credential Manager
If you try to push/pull, a popup should appear.
// turbo
Ensure helper is set to manager:
```powershell
git config --global credential.helper manager
```

## 5. Verification
// turbo
Test the connection.
```powershell
git fetch origin
```
