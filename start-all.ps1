# ATS SaaS - Complete Startup Script
# Starts PostgreSQL, Backend, and Frontend

Write-Host "🚀 Starting ATS SaaS Platform..." -ForegroundColor Cyan
Write-Host ""

# 1. Check PostgreSQL
Write-Host "📊 Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql-x64-16" -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL is already running" -ForegroundColor Green
    } else {
        Write-Host "⚡ Starting PostgreSQL service..." -ForegroundColor Yellow
        Start-Service -Name "postgresql-x64-16"
        Start-Sleep -Seconds 2
        Write-Host "✅ PostgreSQL started" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  PostgreSQL service not found. Make sure PostgreSQL is installed." -ForegroundColor Red
    Write-Host "   Continuing anyway..." -ForegroundColor Gray
}

Write-Host ""

# 2. Check Database Connection
Write-Host "🔌 Testing database connection..." -ForegroundColor Yellow
try {
    # Set PGPASSWORD from .env file to avoid password prompt
    $envContent = Get-Content .env -ErrorAction SilentlyContinue
    foreach ($line in $envContent) {
        if ($line -match '^DB_PASSWORD=(.+)$') {
            $env:PGPASSWORD = $matches[1]
            break
        }
    }
    
    $result = & psql -h 127.0.0.1 -U postgres -d ats_saas -c "SELECT 1;" -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not connect to database (may need manual start)" -ForegroundColor Yellow
    }
    
    # Clear password from environment
    $env:PGPASSWORD = $null
} catch {
    Write-Host "⚠️  Database check skipped (psql not in PATH)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Start Backend & Frontend
Write-Host "🎯 Starting Backend + Super Admin + Business portals..." -ForegroundColor Cyan
Write-Host "   Super Admin UI: http://localhost:5174" -ForegroundColor Gray
Write-Host "   Business UI:    http://localhost:5180" -ForegroundColor Gray
Write-Host "   (API port is from your .env, often 3001)" -ForegroundColor Gray
Write-Host ""
Write-Host "   Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host ""

# Two portals + API (see scripts/dev-full.js)
npm run dev:full
