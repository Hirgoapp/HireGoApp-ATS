# Service Status Checker
Write-Host "`n=== ATS Service Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Check Backend
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -UseBasicParsing
    Write-Host "✅ Backend (Port 3000): RUNNING" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend (Port 3000): NOT RUNNING" -ForegroundColor Red
}

# Check Super Admin UI
try {
    $superAdmin = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 2 -UseBasicParsing
    Write-Host "✅ Super Admin UI (Port 5174): RUNNING" -ForegroundColor Green
}
catch {
    try {
        $superAdmin = Invoke-WebRequest -Uri "http://localhost:5175" -TimeoutSec 2 -UseBasicParsing
        Write-Host "✅ Super Admin UI (Port 5175): RUNNING" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Super Admin UI: NOT RUNNING" -ForegroundColor Red
    }
}

# Check Business UI
try {
    $business = Invoke-WebRequest -Uri "http://localhost:5180" -TimeoutSec 2 -UseBasicParsing
    Write-Host "✅ Business UI (Port 5180): RUNNING" -ForegroundColor Green
}
catch {
    try {
        $business = Invoke-WebRequest -Uri "http://localhost:5181" -TimeoutSec 2 -UseBasicParsing
        Write-Host "✅ Business UI (Port 5181): RUNNING" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Business UI: NOT RUNNING" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Super Admin Login Credentials ===" -ForegroundColor Yellow
Write-Host "Email:    super@admin.com" -ForegroundColor White
Write-Host "Password: SuperAdmin123!" -ForegroundColor White
Write-Host ""
