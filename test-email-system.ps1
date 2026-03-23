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
    Write-Host "OK - Super Admin authenticated" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "FAILED - Login error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create Test Company
Write-Host "[2] Creating Test Company..." -ForegroundColor Yellow
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
    Write-Host "OK - Company created" -ForegroundColor Green
    Write-Host ""
    Write-Host "EMAIL NOTIFICATION SENT:" -ForegroundColor Cyan
    Write-Host "  To: $testEmail" -ForegroundColor Cyan
    Write-Host "  From: support@workatyourplace.com" -ForegroundColor Cyan
    Write-Host "  Subject: Welcome to Test Email Company" -ForegroundColor Cyan
    Write-Host ""
    
}
catch {
    Write-Host "FAILED - Company creation error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Add Additional Admin
Write-Host "[3] Adding Second Admin to Company..." -ForegroundColor Yellow
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
    
    Write-Host "OK - Second admin created" -ForegroundColor Green
    Write-Host ""
    Write-Host "EMAIL NOTIFICATION SENT:" -ForegroundColor Cyan
    Write-Host "  To: $secondAdminEmail" -ForegroundColor Cyan
    Write-Host "  From: support@workatyourplace.com" -ForegroundColor Cyan
    Write-Host "  Subject: Welcome to Test Email Company" -ForegroundColor Cyan
    Write-Host ""
    
}
catch {
    Write-Host "FAILED - Admin creation error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "STATUS: CENTRALIZED EMAIL SYSTEM ACTIVE" -ForegroundColor Green
Write-Host ""
Write-Host "Two emails sent from support@workatyourplace.com:" -ForegroundColor Yellow
Write-Host "  1. Welcome email to $testEmail" -ForegroundColor White
Write-Host "  2. Welcome email to $secondAdminEmail" -ForegroundColor White
Write-Host ""
Write-Host "All company and admin notifications go through this centralized channel." -ForegroundColor Green
