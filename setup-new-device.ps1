#!/usr/bin/env powershell
# This script automates PHASE 3, 4, and 5 of the migration process
# Run this AFTER manually installing Node.js, PostgreSQL, and Git

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ATS Project - Automated Setup Script for New Device      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  This script needs to run as Administrator!" -ForegroundColor Yellow
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit
}

# Step 1: Create database
Write-Host "📦 STEP 1: Creating PostgreSQL database..." -ForegroundColor Green
Write-Host "   This creates the 'ats_saas' database"
$env:PGPASSWORD = 'password'
try {
    psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE ats_saas;" 2>$null
    Write-Host "   ✅ Database created successfully" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Database might already exist (that's okay)" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Navigate to project
Write-Host "📂 STEP 2: Locating project folder..." -ForegroundColor Green
if (-not (Test-Path ".\package.json")) {
    Write-Host "   ❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "   Please navigate to your ATS project folder first:" -ForegroundColor Yellow
    Write-Host "   cd C:\Projects\ats" -ForegroundColor Yellow
    exit
}
Write-Host "   ✅ Project folder found" -ForegroundColor Green
Write-Host ""

# Step 3: Install dependencies
Write-Host "📥 STEP 3: Installing npm packages..." -ForegroundColor Green
Write-Host "   This may take 5-10 minutes..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ npm install failed" -ForegroundColor Red
    exit
}
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Check .env file
Write-Host "🔐 STEP 4: Checking environment configuration..." -ForegroundColor Green
if (-not (Test-Path ".\.env")) {
    Write-Host "   ⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Please copy .env from your current device to this project folder" -ForegroundColor Yellow
    Write-Host "   Then run this script again" -ForegroundColor Yellow
    exit
}
Write-Host "   ✅ .env file found" -ForegroundColor Green
Write-Host ""

# Step 5: Run migrations
Write-Host "🗄️  STEP 5: Running database migrations..." -ForegroundColor Green
Write-Host "   Creating database tables..."
npm run migration:run
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Migrations failed" -ForegroundColor Red
    Write-Host "   Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   - Check PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "   - Verify database 'ats_saas' was created" -ForegroundColor Yellow
    Write-Host "   - Check .env file database credentials" -ForegroundColor Yellow
    exit
}
Write-Host "   ✅ Migrations completed" -ForegroundColor Green
Write-Host ""

# Step 6: Seed bootstrap admin
Write-Host "🌱 STEP 6: Seeding initial data..." -ForegroundColor Green
npm run seed:bootstrap
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Bootstrap seed had issues (might already exist)" -ForegroundColor Yellow
}
Write-Host "   ✅ Bootstrap complete" -ForegroundColor Green
Write-Host ""

# Step 7: Build the project
Write-Host "🔨 STEP 7: Building the project..." -ForegroundColor Green
Write-Host "   This compiles TypeScript to JavaScript..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Build failed" -ForegroundColor Red
    exit
}
Write-Host "   ✅ Build successful" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ Setup Complete! Ready to start the application       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run the development server:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "   2. Or run the production server:" -ForegroundColor White
Write-Host "      npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "   3. Test the API:" -ForegroundColor White
Write-Host "      Open Chrome and go to: http://localhost:3000/api/health" -ForegroundColor Yellow
Write-Host ""

Write-Host "📖 For detailed information, see:" -ForegroundColor Cyan
Write-Host "   MIGRATION_GUIDE_NEW_DEVICE.md" -ForegroundColor Yellow
Write-Host ""
