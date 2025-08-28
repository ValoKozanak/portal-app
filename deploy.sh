#!/bin/bash

# 🚀 Deployment Script pre Client Portal
# Použitie: ./deploy.sh [vercel|railway|docker]

set -e

echo "🚀 Spúšťam deployment script..."

# Farba pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcia pre logovanie
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Kontrola prítomnosti súborov
check_files() {
    log "Kontrolujem potrebné súbory..."
    
    required_files=(
        "package.json"
        "backend/package.json"
        "vercel.json"
        "backend/railway.json"
        "Dockerfile"
        "backend/Dockerfile"
        "docker-compose.yml"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Chýba súbor: $file"
        fi
    done
    
    log "✅ Všetky potrebné súbory sú prítomné"
}

# Build aplikácie
build_app() {
    log "Buildujem aplikáciu..."
    
    # Frontend build
    log "Buildujem frontend..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log "✅ Frontend build úspešný"
    else
        error "❌ Frontend build zlyhal"
    fi
}

# Git commit a push
git_deploy() {
    log "Commit a push na GitHub..."
    
    git add .
    git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
    git push origin main
    
    log "✅ Kód pushnutý na GitHub"
}

# Docker deployment
docker_deploy() {
    log "Spúšťam Docker deployment..."
    
    # Zastavenie existujúcich kontajnerov
    docker-compose down
    
    # Build a spustenie
    docker-compose up --build -d
    
    log "✅ Docker deployment úspešný"
    log "🌐 Frontend: http://localhost:3000"
    log "🔧 Backend: http://localhost:5000"
}

# Vercel deployment
vercel_deploy() {
    log "Spúšťam Vercel deployment..."
    
    # Kontrola Vercel CLI
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI nie je nainštalované. Nainštalujte: npm i -g vercel"
    fi
    
    # Deploy
    vercel --prod
    
    log "✅ Vercel deployment úspešný"
}

# Railway deployment
railway_deploy() {
    log "Spúšťam Railway deployment..."
    
    # Kontrola Railway CLI
    if ! command -v railway &> /dev/null; then
        error "Railway CLI nie je nainštalované. Nainštalujte: npm i -g @railway/cli"
    fi
    
    # Deploy backend
    cd backend
    railway up
    
    log "✅ Railway deployment úspešný"
}

# Hlavná funkcia
main() {
    local deployment_type=$1
    
    log "Začínam deployment typu: $deployment_type"
    
    # Kontrola súborov
    check_files
    
    case $deployment_type in
        "docker")
            build_app
            docker_deploy
            ;;
        "vercel")
            build_app
            git_deploy
            vercel_deploy
            ;;
        "railway")
            git_deploy
            railway_deploy
            ;;
        "all")
            build_app
            git_deploy
            vercel_deploy
            railway_deploy
            ;;
        *)
            echo "Použitie: $0 [docker|vercel|railway|all]"
            echo ""
            echo "Možnosti:"
            echo "  docker   - Lokálne nasadenie s Docker"
            echo "  vercel   - Nasadenie frontendu na Vercel"
            echo "  railway  - Nasadenie backendu na Railway"
            echo "  all      - Kompletné nasadenie"
            exit 1
            ;;
    esac
    
    log "🎉 Deployment dokončený!"
}

# Spustenie skriptu
main "$@"
