# Step 2: Create Demo Company

$token = (Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/auth/login' `
    -Method POST `
    -ContentType 'application/json' `
    -Body (ConvertTo-Json @{ 
        email = 'admin@ats.com'
        password = 'ChangeMe@123'
    })).data.accessToken

Write-Host "Token obtained: $($token.Substring(0, 50))..."

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

Write-Host "`nCreating company..."

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$result = Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/companies' `
    -Method POST `
    -Headers $headers `
    -Body $body

$result | ConvertTo-Json -Depth 10
