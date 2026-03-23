# Test Email Import API

Write-Host "=== Email Import API Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get auth token
Write-Host "Step 1: Getting auth token..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email    = "admin@ats.com"
        password = "ChangeMe@123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/auth/login' -Method POST -ContentType 'application/json' -Body $loginBody -ErrorAction Stop
    $token = $loginResponse.data.accessToken
    Write-Host "✅ Token obtained: $($token.Substring(0, 30))..." -ForegroundColor Green
}
catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Test email parsing
Write-Host "`nStep 2: Testing email parsing endpoint..." -ForegroundColor Yellow

$emailContent = @"
From: client@company.com
To: recruiter@ats.com
Subject: ECMS:545390 - Senior PEGA Developer - India - EAIS

Dear Recruitment Team,

Please find below the requirement:

**Role:** Senior PEGA Developer
**ECMS ID:** ECMS-545390
**Client:** EAIS
**Location:** Bangalore, India
**Vendor Rate:** 45-50 USD/hour

**Mandatory Skills:**
- PEGA 8.x
- JSP
- Java

**Desired Skills:**
- Angular
- Docker

**Experience:** 8-10 years

**Candidate Tracker Format:**
Candidate Name | Email | Mobile | Experience | CTC | Status

**Submission Guidelines:**
- Send PDF resumes
- Screenshots required within 24 hours
- Email: recruitment@eais.com

Regards,
EAIS Team
"@

$importBody = @{
    emailContent = $emailContent
    format       = "text"
} | ConvertTo-Json

try {
    Write-Host "Calling POST /api/v1/jobs/import-from-email..." -ForegroundColor Cyan
    $parseResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/jobs/import-from-email' -Method POST -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body $importBody -ErrorAction Stop
    
    Write-Host "✅ Email parsed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Extracted Data:" -ForegroundColor Cyan
    Write-Host ($parseResponse | ConvertTo-Json -Depth 8)
}
catch {
    Write-Host "❌ Email parsing failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $streamReader.BaseStream.Position = 0
        $errorDetails = $streamReader.ReadToEnd()
        Write-Host "Response: $errorDetails" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
