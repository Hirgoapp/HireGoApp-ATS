#!/usr/bin/env pwsh
# Dynamic JD System - Quick Setup Script
# Run this to complete the Dynamic JD System setup

Write-Host "🚀 Dynamic JD System - Complete Setup" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

try {
    # Step 1: Create upload directory
    Write-Host "📁 Creating upload directory..." -ForegroundColor Yellow
    $uploadDir = "G:\ATS\uploads\jd-files"
    New-Item -ItemType Directory -Force -Path $uploadDir | Out-Null
    Write-Host "✅ Upload directory created: $uploadDir`n" -ForegroundColor Green

    # Step 2: Install packages
    Write-Host "📦 Installing required packages..." -ForegroundColor Yellow
    Write-Host "   (This may take a few minutes)" -ForegroundColor Gray
    Set-Location "G:\ATS"
    npm install pdf-parse mammoth react-markdown --save
    Write-Host "✅ Packages installed`n" -ForegroundColor Green

    # Step 3: Run migration
    Write-Host "🗄️  Running database migration..." -ForegroundColor Yellow
    Write-Host "   (This will add 6 new columns to jobs table)" -ForegroundColor Gray
    npm run migration:run
    Write-Host "✅ Database migrated`n" -ForegroundColor Green

    # Step 4: Build frontend
    Write-Host "🏗️  Building frontend..." -ForegroundColor Yellow
    Set-Location "G:\ATS\frontend\business"
    npm run build
    Write-Host "✅ Frontend built`n" -ForegroundColor Green

    Write-Host "🎉 All setup complete!" -ForegroundColor Green
    Write-Host "======================================`n" -ForegroundColor Cyan

    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your dev server (npm run dev)" -ForegroundColor White
    Write-Host "2. Go to http://localhost:5180/app/jobs" -ForegroundColor White
    Write-Host "3. Click 'Create Job'" -ForegroundColor White
    Write-Host "4. Check 'Use Dynamic JD System' checkbox" -ForegroundColor White
    Write-Host "5. Try pasting or uploading a job description" -ForegroundColor White
    Write-Host "`n📚 For full testing guide, see: test-dynamic-jd.md`n" -ForegroundColor Cyan

}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
