# Step 2: Create Demo Company with unique slug

$token = (Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/auth/login' `
        -Method POST `
        -ContentType 'application/json' `
        -Body (ConvertTo-Json @{ 
            email    = 'admin@ats.com'
            password = 'ChangeMe@123'
        })).data.accessToken

Write-Host "Token obtained: $($token.Substring(0, 50))..." -ForegroundColor Green

$uniqueId = Get-Random -Maximum 99999
$body = @{ 
    name         = "Test Company $uniqueId"
    slug         = "testco-$uniqueId"
    email        = 'test@testco.com'
    licenseTier  = 'premium'
    initialAdmin = @{ 
        firstName = 'Admin'
        lastName  = 'Tester'
        email     = "admin-$uniqueId@testco.com"
        password  = 'AdminTest@123'
    }
} | ConvertTo-Json -Depth 10

Write-Host "`n🚀 Creating company..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3000/api/super-admin/companies' `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "`n✅✅✅ SUCCESS! Company Created!" -ForegroundColor Green
    Write-Host "`n📊 Company Details:" -ForegroundColor Cyan
    Write-Host "  Company ID: $($result.data.company.id)" -ForegroundColor Cyan
    Write-Host "  Name: $($result.data.company.name)" -ForegroundColor Cyan
    Write-Host "  Slug: $($result.data.company.slug)" -ForegroundColor Cyan
    Write-Host "  License Tier: $($result.data.company.license_tier)" -ForegroundColor Cyan
    Write-Host "`n👤 Admin User Details:" -ForegroundColor Cyan
    Write-Host "  Email: $($result.data.admin.email)" -ForegroundColor Cyan
    Write-Host "  Name: $($result.data.admin.first_name) $($result.data.admin.last_name)" -ForegroundColor Cyan
    
}
catch {
    Write-Host "`n❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
