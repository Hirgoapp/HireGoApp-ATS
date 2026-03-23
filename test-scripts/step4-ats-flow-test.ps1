# Step 4: Test Complete ATS Flow

$token = Get-Content ".\test-scripts\company-admin-token.txt" -Raw
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== STEP 4: Creating Test Candidate ===" -ForegroundColor Cyan

try {
    $candidateBody = @{
        first_name = "John"
        last_name = "Doe"
        email = "john.doe@example.com"
        phone = "+1-555-0100"
        source = "referral"
        status = "active"
        resume_url = "https://example.com/resumes/john-doe.pdf"
    } | ConvertTo-Json
    
    $candidate = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/candidates' `
        -Method POST `
        -Headers $headers `
        -Body $candidateBody
    
    Write-Host "✅ Candidate created:" -ForegroundColor Green
    Write-Host "  ID: $($candidate.data.id)"
    Write-Host "  Name: $($candidate.data.first_name) $($candidate.data.last_name)"
    Write-Host "  Company ID: $($candidate.data.company_id)"
    
    $candidateId = $candidate.data.id
} catch {
    Write-Host "❌ Failed to create candidate:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
    exit 1
}

Write-Host "`n=== STEP 5: Creating Test Job ===" -ForegroundColor Cyan

try {
    $jobBody = @{
        title = "Senior Software Engineer"
        department = "Engineering"
        location = "San Francisco, CA"
        employment_type = "full-time"
        status = "open"
        description = "We are looking for an experienced software engineer..."
        requirements = "5+ years of experience, strong problem-solving skills"
        salary_min = 120000
        salary_max = 180000
    } | ConvertTo-Json
    
    $job = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/jobs' `
        -Method POST `
        -Headers $headers `
        -Body $jobBody
    
    Write-Host "✅ Job created:" -ForegroundColor Green
    Write-Host "  ID: $($job.data.id)"
    Write-Host "  Title: $($job.data.title)"
    Write-Host "  Company ID: $($job.data.company_id)"
    
    $jobId = $job.data.id
} catch {
    Write-Host "❌ Failed to create job:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
    exit 1
}

Write-Host "`n=== STEP 6: Creating Test Submission ===" -ForegroundColor Cyan

try {
    $submissionBody = @{
        candidate_id = $candidateId
        job_id = $jobId
        stage = "applied"
        source = "company_website"
    } | ConvertTo-Json
    
    $submission = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/submissions' `
        -Method POST `
        -Headers $headers `
        -Body $submissionBody
    
    Write-Host "✅ Submission created:" -ForegroundColor Green
    Write-Host "  ID: $($submission.data.id)"
    Write-Host "  Candidate ID: $($submission.data.candidate_id)"
    Write-Host "  Job ID: $($submission.data.job_id)"
    Write-Host "  Company ID: $($submission.data.company_id)"
    Write-Host "  Stage: $($submission.data.stage)"
    
    $submissionId = $submission.data.id
} catch {
    Write-Host "❌ Failed to create submission:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
    exit 1
}

Write-Host "`n=== STEP 7: Fetching All Candidates ===" -ForegroundColor Cyan

try {
    $candidates = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/candidates' `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Candidates fetched:" -ForegroundColor Green
    Write-Host "  Total: $($candidates.data.total)"
    Write-Host "  Returned: $($candidates.data.candidates.Count)"
    Write-Host "  Company IDs:" 
    $candidates.data.candidates | ForEach-Object {
        Write-Host "    - $($_.company_id)"
    }
} catch {
    Write-Host "❌ Failed to fetch candidates:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== STEP 8: Fetching All Jobs ===" -ForegroundColor Cyan

try {
    $jobs = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/jobs' `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Jobs fetched:" -ForegroundColor Green
    Write-Host "  Total: $($jobs.data.total)"
    Write-Host "  Returned: $($jobs.data.jobs.Count)"
    Write-Host "  Company IDs:"
    $jobs.data.jobs | ForEach-Object {
        Write-Host "    - $($_.company_id)"
    }
} catch {
    Write-Host "❌ Failed to fetch jobs:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== STEP 9: Fetching All Submissions ===" -ForegroundColor Cyan

try {
    $submissions = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/submissions' `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Submissions fetched:" -ForegroundColor Green
    Write-Host "  Total: $($submissions.data.total)"
    Write-Host "  Returned: $($submissions.data.submissions.Count)"
    Write-Host "  Company IDs:"
    $submissions.data.submissions | ForEach-Object {
        Write-Host "    - $($_.company_id)"
    }
} catch {
    Write-Host "❌ Failed to fetch submissions:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== TENANT ISOLATION CHECK ===" -ForegroundColor Yellow
Write-Host "Expected Company ID: 0d0bc91e-592a-4885-8256-266a520903ad"
Write-Host "All records should have this company_id to confirm tenant isolation."

Write-Host "`n=== ALL TESTS COMPLETE ===" -ForegroundColor Green
