# Test candidate creation after migration
Write-Host "Testing candidate creation endpoint..." -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Logging in as company admin..." -ForegroundColor Yellow
$loginResp = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method POST `
    -Body '{"email":"admin@demo-company.com","password":"DemoAdmin@123"}' `
    -ContentType "application/json"

$token = $loginResp.data.token
Write-Host "✅ Login successful" -ForegroundColor Green

# Step 2: Create candidate
Write-Host "`n2. Creating candidate..." -ForegroundColor Yellow
try {
    $candidateResp = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/candidates" `
        -Method POST `
        -Body '{"first_name":"John","last_name":"Doe","email":"john.doe@test.com","status":"active"}' `
        -ContentType "application/json" `
        -Headers @{Authorization="Bearer $token"}
    
    Write-Host "`n✅✅✅ SUCCESS - CANDIDATE CREATED ✅✅✅`n" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $candidateResp | ConvertTo-Json -Depth 5
} catch {
    Write-Host "`n❌ ERROR" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error Message:" -ForegroundColor Red
    $_.ErrorDetails.Message
}
