#!/usr/bin/env pwsh

# Test file upload with dynamic JD

$apiUrl = "http://localhost:3000/api/v1"
$jobTitle = "Test Job $(Get-Date -Format 'HHmmss')"

Write-Host "════════════════════════════════════════════"
Write-Host "Testing File Upload Workflow"
Write-Host "════════════════════════════════════════════"

# Step 1: Create a job with Dynamic JD enabled
Write-Host ""
Write-Host "📝 Step 1: Creating job with Dynamic JD..."
Write-Host ""

$jobPayload = @{
    title          = $jobTitle
    description    = "Test job for file upload"
    use_dynamic_jd = $true
    jd_content     = "Senior Software Engineer - Test"
    jd_format      = "plain"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod `
        -Uri "$apiUrl/jobs" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $($env:TEST_TOKEN)" } `
        -Body $jobPayload

    $jobId = $response.data.id
    Write-Host "✅ Job created: $jobId"
    Write-Host "   Title: $($response.data.title)"
}
catch {
    Write-Host "❌ Failed to create job: $($_.Exception.Message)"
    exit 1
}

# Step 2: Create a test file
Write-Host ""
Write-Host "📄 Step 2: Creating test file..."
$testFile = "$PSScriptRoot\test-jd.txt"
"Senior Software Engineer

About the Role:
We are seeking an experienced Senior Software Engineer to lead our platform development.

Responsibilities:
- Lead the development of our core platform
- Mentor junior engineers
- Architecture and design decisions

Requirements:
- 8+ years of experience
- Strong in TypeScript/Node.js
- Leadership experience

Skills:
- Mandatory: TypeScript, Node.js, PostgreSQL
- Desired: React, AWS, Kubernetes" | Set-Content $testFile

Write-Host "✅ Test file created: $testFile"

# Step 3: Upload the file
Write-Host ""
Write-Host "📤 Step 3: Uploading JD file..."
Write-Host ""

try {
    $fileContent = [System.IO.File]::ReadAllBytes($testFile)
    $boundary = [System.Guid]::NewGuid().ToString()
    
    $bodyBuilder = [System.Text.StringBuilder]::new()
    [void]$bodyBuilder.AppendLine("--$boundary")
    [void]$bodyBuilder.AppendLine('Content-Disposition: form-data; name="file"; filename="test-jd.txt"')
    [void]$bodyBuilder.AppendLine("Content-Type: text/plain")
    [void]$bodyBuilder.AppendLine()
    
    $body = [System.Text.Encoding]::UTF8.GetBytes($bodyBuilder.ToString())
    $body += $fileContent
    $body += [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")
    
    $response = Invoke-RestMethod `
        -Uri "$apiUrl/jobs/$jobId/jd-upload" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Headers @{ Authorization = "Bearer $($env:TEST_TOKEN)" } `
        -Body $body
    
    Write-Host "✅ File uploaded successfully!"
    Write-Host "   Result: $($response.data | ConvertTo-Json -Depth 5)"
}
catch {
    Write-Host "❌ File upload failed: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}

# Cleanup
Remove-Item $testFile -Force

Write-Host ""
Write-Host "════════════════════════════════════════════"
Write-Host "Test Complete!"
Write-Host "════════════════════════════════════════════"
