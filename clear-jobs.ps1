# Login
$loginBody = @{
    email    = "itsupport@o2finfosolutions.com"
    password = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body $loginBody
$token = $response.accessToken
Write-Host "✓ Logged in successfully" -ForegroundColor Green

# Get all jobs
$headers = @{
    Authorization = "Bearer $token"
}

$jobsResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/jobs' -Method GET -Headers $headers
$jobs = $jobsResponse.data

Write-Host "`n📋 Found $($jobs.Count) jobs:" -ForegroundColor Cyan
foreach ($job in $jobs) {
    Write-Host "   - $($job.title) (ID: $($job.id))"
}

# Delete all jobs
Write-Host "`n🗑️  Deleting all jobs..." -ForegroundColor Yellow
foreach ($job in $jobs) {
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/api/v1/jobs/$($job.id)" -Method DELETE -Headers $headers | Out-Null
        Write-Host "   ✓ Deleted: $($job.title)" -ForegroundColor Green
    }
    catch {
        Write-Host "   ✗ Failed to delete: $($job.title)" -ForegroundColor Red
    }
}

Write-Host "`n✅ All jobs have been deleted!" -ForegroundColor Green
Write-Host "Please refresh your browser to see the empty jobs list." -ForegroundColor Cyan
