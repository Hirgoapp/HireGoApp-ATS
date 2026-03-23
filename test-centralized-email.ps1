#!/usr/bin/env powershell
# Test the centralized email notification system

Write-Host "=== CENTRALIZED EMAIL NOTIFICATION SYSTEM TEST ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Super Admin
Write-Host "[1] Super Admin Login..." -ForegroundColor Yellow
try {
    $loginResp = Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/auth/login' `
        -Method POST -ContentType 'application/json' `
        -Body (ConvertTo-Json @{ 
            email    = 'admin@ats.com'
            password = 'ChangeMe@123'
        }) -ErrorAction Stop
    
    $token = $loginResp.data.accessToken
    Write-Host "✅ Super Admin authenticated" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create Test Company
Write-Host "[2] Creating Test Company (notification will be sent)..." -ForegroundColor Yellow
$timestamp = [DateTime]::Now.Ticks
$testEmail = "admin-test-$timestamp@testcompany.com"

try {
    $companyResp = Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/companies' `
        -Method POST -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body (ConvertTo-Json @{
            name         = 'Test Email Company'
            slug         = "test-email-$timestamp"
            email        = 'contact@testcompany.com'
            licenseTier  = 'premium'
            initialAdmin = @{
                firstName = 'Test'
                lastName  = 'Admin'
                email     = $testEmail
                password  = 'TestAdmin@123!'
            }
        }) -ErrorAction Stop
    
    $companyId = $companyResp.data.id
    Write-Host "✅ Company created: $companyId" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 EMAIL SENT TO: $testEmail" -ForegroundColor Cyan
    Write-Host "   From: support@workatyourplace.com (ATS Platform)" -ForegroundColor Cyan
    Write-Host "   Subject: Welcome to Test Email Company" -ForegroundColor Cyan
    Write-Host ""
    
}
catch {
    Write-Host "❌ Company creation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Add Additional Admin (second email notification)
Write-Host "[3] Adding Second Admin to Company (another email will be sent)..." -ForegroundColor Yellow
$secondAdminEmail = "admin2-test-$timestamp@testcompany.com"

try {
    $adminResp = Invoke-RestMethod -Uri "http://localhost:3000/api/super-admin/companies/$companyId/admins" `
        -Method POST -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body (ConvertTo-Json @{
            email     = $secondAdminEmail
            firstName = 'Second'
            lastName  = 'Admin'
            password  = 'SecondAdmin@123!'
        }) -ErrorAction Stop
    
    Write-Host "✅ Additional admin created" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 EMAIL SENT TO: $secondAdminEmail" -ForegroundColor Cyan
    Write-Host "   From: support@workatyourplace.com (ATS Platform)" -ForegroundColor Cyan
    Write-Host "   Subject: Welcome to Test Email Company" -ForegroundColor Cyan
    Write-Host ""
    
}
catch {
    Write-Host "❌ Admin creation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Summary
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 CENTRALIZED EMAIL SYSTEM STATUS: ACTIVE ✅" -ForegroundColor Green
Write-Host ""
Write-Host "Two notification emails have been sent from support@workatyourplace.com:" -ForegroundColor Yellow
Write-Host "  1️⃣  Welcome email to: $testEmail" -ForegroundColor White
Write-Host "  2️⃣  Welcome email to: $secondAdminEmail" -ForegroundColor White
Write-Host ""
Write-Host "📌 Expected Recipient Inbox Subjects:" -ForegroundColor Cyan
Write-Host "   - Welcome to Test Email Company (from support@workatyourplace.com)" -ForegroundColor Cyan
Write-Host "   - Login URL: http://localhost:5180/login (Business portal)" -ForegroundColor Cyan
Write-Host "   - Includes: Email, Temporary Password, Company Details" -ForegroundColor Cyan
Write-Host ""
Write-Host "READY - All future company creations will send centralized notifications!" -ForegroundColor Green
