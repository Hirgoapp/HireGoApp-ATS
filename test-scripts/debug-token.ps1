# Test token extraction
$token = (Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/auth/login' `
    -Method POST `
    -ContentType 'application/json' `
    -Body (ConvertTo-Json @{ 
        email = 'admin@ats.com'
        password = 'ChangeMe@123'
    })).data.accessToken

Write-Host "Token: $token"
Write-Host "`nTesting with proper headers..."

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "`nHeaders being sent:"
    $headers | Format-Table
    
    $body = @{ 
        name = 'Demo Company'
        slug = 'demo-company'
        email = 'demo@company.com'
        licenseTier = 'premium'
        initialAdmin = @{ 
            firstName = 'Admin'
            lastName = 'Demo'
            email = 'admin@demo-company.com'
            password = 'DemoAdmin@123'
        }
    } | ConvertTo-Json -Depth 10
    
    Write-Host "`nBody:"
    Write-Host $body
    
    $result = Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/companies' `
        -Method POST `
        -ContentType 'application/json' `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "`nSuccess!"
    $result | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`nError occurred:"
    Write-Host $_.Exception.Message
    Write-Host "`nResponse body:"
    $_.ErrorDetails.Message
}
