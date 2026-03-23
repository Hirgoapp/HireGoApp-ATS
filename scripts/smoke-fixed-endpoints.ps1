$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3001'
$loginBody = @{ email = 'itsupport@o2finfosolutions.com'; password = 'Admin@123' } | ConvertTo-Json

$login = Invoke-RestMethod -Uri ($base + '/api/v1/auth/login') -Method POST -ContentType 'application/json' -Body $loginBody
$token = $login.data.token
if (-not $token) {
    throw 'Login succeeded but no token was returned in data.token'
}

Write-Host 'AUTH_OK'

try {
    $candidates = Invoke-RestMethod -Uri ($base + '/api/v1/candidates?page=1&limit=200') -Headers @{ Authorization = "Bearer $token" } -Method GET
    Write-Host ('CANDIDATES_OK total=' + $candidates.total)
}
catch {
    Write-Host ('CANDIDATES_FAIL ' + $_.Exception.Message)
}

try {
    $submissions = Invoke-RestMethod -Uri ($base + '/api/v1/submissions?skip=0&take=50&include=candidate') -Headers @{ Authorization = "Bearer $token" } -Method GET
    Write-Host ('SUBMISSIONS_OK count=' + ($submissions.data | Measure-Object).Count)
}
catch {
    Write-Host ('SUBMISSIONS_FAIL ' + $_.Exception.Message)
}

try {
    $jobs = Invoke-RestMethod -Uri ($base + '/api/v1/jobs?page=1&limit=1') -Headers @{ Authorization = "Bearer $token" } -Method GET
    $jobId = $null

    if ($jobs.data -and $jobs.data.Count -gt 0) {
        $jobId = $jobs.data[0].id
    }
    elseif ($jobs.data -and $jobs.data.id) {
        $jobId = $jobs.data.id
    }

    if ($jobId) {
        $matching = Invoke-RestMethod -Uri ($base + '/api/v1/matching/jobs/' + $jobId + '/suggestions?limit=10&minScore=0&poolSize=25') -Headers @{ Authorization = "Bearer $token" } -Method GET
        Write-Host ('MATCHING_OK job=' + $jobId)
    }
    else {
        Write-Host 'MATCHING_SKIPPED no_job'
    }
}
catch {
    Write-Host ('MATCHING_FAIL ' + $_.Exception.Message)
}
