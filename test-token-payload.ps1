# Quick test to verify JWT payload with companyId
try {
    Write-Host "Logging in..."
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' `
        -Method POST `
        -ContentType 'application/json' `
        -Body (ConvertTo-Json @{ 
            email    = 'admin@demo-company.com'
            password = 'DemoAdmin@123'
        }) `
        -ErrorAction Stop
    
    $token = $response.data.token
    Write-Host "Token received!"
    
    # Decode JWT payload
    $tokenParts = $token.Split('.')
    $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
    
    Write-Host "`n=== JWT Payload ===" -ForegroundColor Cyan
    $payloadObj = $payload | ConvertFrom-Json
    $payloadObj | ConvertTo-Json
    
    # Check for companyId
    if ($payloadObj.companyId) {
        Write-Host "`n✅ companyId FOUND: $($payloadObj.companyId)" -ForegroundColor Green
    }
    else {
        Write-Host "`n❌ companyId MISSING!" -ForegroundColor Red
    }
    
    # Check for sub
    if ($payloadObj.sub) {
        Write-Host "✅ sub FOUND: $($payloadObj.sub)" -ForegroundColor Green
    }
    else {
        Write-Host "❌ sub MISSING!" -ForegroundColor Yellow
    }
    
    # Save token for subsequent tests
    $token | Out-File -FilePath ".\test-scripts\company-admin-token.txt" -NoNewline
    Write-Host "`nToken saved to test-scripts\company-admin-token.txt"
    
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message -ForegroundColor Red
}
