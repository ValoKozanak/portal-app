# 🚀 Deployment Script pre Client Portal (PowerShell)
# Použitie: .\deploy.ps1 [vercel|railway|docker]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("docker", "vercel", "railway", "all")]
    [string]$DeploymentType
)

# Nastavenie error handling
$ErrorActionPreference = "Stop"

Write-Host "🚀 Spúšťam deployment script..." -ForegroundColor Green

# Funkcia pre logovanie
function Write-Log {
    param([string]$Message, [string]$Color = "Green")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Warning {
    param([string]$Message)
    Write-Log "WARNING: $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-Log "ERROR: $Message" "Red"
    exit 1
}

# Kontrola prítomnosti súborov
function Test-RequiredFiles {
    Write-Log "Kontrolujem potrebné súbory..."
    
    $requiredFiles = @(
        "package.json",
        "backend/package.json",
        "vercel.json",
        "backend/railway.json",
        "Dockerfile",
        "backend/Dockerfile",
        "docker-compose.yml"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Chýba súbor: $file"
        }
    }
    
    Write-Log "✅ Všetky potrebné súbory sú prítomné"
}

# Build aplikácie
function Build-App {
    Write-Log "Buildujem aplikáciu..."
    
    # Frontend build
    Write-Log "Buildujem frontend..."
    try {
        npm run build
        Write-Log "✅ Frontend build úspešný"
    }
    catch {
        Write-Error "❌ Frontend build zlyhal: $_"
    }
}

# Git commit a push
function Git-Deploy {
    Write-Log "Commit a push na GitHub..."
    
    try {
        git add .
        git commit -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push origin main
        Write-Log "✅ Kód pushnutý na GitHub"
    }
    catch {
        Write-Error "❌ Git operácia zlyhala: $_"
    }
}

# Docker deployment
function Docker-Deploy {
    Write-Log "Spúšťam Docker deployment..."
    
    try {
        # Zastavenie existujúcich kontajnerov
        docker-compose down
        
        # Build a spustenie
        docker-compose up --build -d
        
        Write-Log "✅ Docker deployment úspešný"
        Write-Log "🌐 Frontend: http://localhost:3000"
        Write-Log "🔧 Backend: http://localhost:5000"
    }
    catch {
        Write-Error "❌ Docker deployment zlyhal: $_"
    }
}

# Vercel deployment
function Vercel-Deploy {
    Write-Log "Spúšťam Vercel deployment..."
    
    # Kontrola Vercel CLI
    try {
        $null = Get-Command vercel -ErrorAction Stop
    }
    catch {
        Write-Error "Vercel CLI nie je nainštalované. Nainštalujte: npm i -g vercel"
    }
    
    try {
        # Deploy
        vercel --prod
        Write-Log "✅ Vercel deployment úspešný"
    }
    catch {
        Write-Error "❌ Vercel deployment zlyhal: $_"
    }
}

# Railway deployment
function Railway-Deploy {
    Write-Log "Spúšťam Railway deployment..."
    
    # Kontrola Railway CLI
    try {
        $null = Get-Command railway -ErrorAction Stop
    }
    catch {
        Write-Error "Railway CLI nie je nainštalované. Nainštalujte: npm i -g @railway/cli"
    }
    
    try {
        # Deploy backend
        Push-Location backend
        railway up
        Pop-Location
        Write-Log "✅ Railway deployment úspešný"
    }
    catch {
        Write-Error "❌ Railway deployment zlyhal: $_"
    }
}

# Hlavná funkcia
function Main {
    param([string]$DeploymentType)
    
    Write-Log "Začínam deployment typu: $DeploymentType"
    
    # Kontrola súborov
    Test-RequiredFiles
    
    switch ($DeploymentType) {
        "docker" {
            Build-App
            Docker-Deploy
        }
        "vercel" {
            Build-App
            Git-Deploy
            Vercel-Deploy
        }
        "railway" {
            Git-Deploy
            Railway-Deploy
        }
        "all" {
            Build-App
            Git-Deploy
            Vercel-Deploy
            Railway-Deploy
        }
    }
    
    Write-Log "🎉 Deployment dokončený!"
}

# Spustenie skriptu
try {
    Main -DeploymentType $DeploymentType
}
catch {
    Write-Error "Deployment zlyhal: $_"
}
