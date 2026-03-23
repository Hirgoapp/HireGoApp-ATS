param(
    [string]$BaseUrl = 'http://192.168.10.4:3001',
    [string]$SuperAdminEmail = 'admin@ats.com',
    [string]$SuperAdminPassword = 'ChangeMe@123',
    [string]$TargetCompanyKeyword = 'demo',
    [string]$DemoAdminPassword = 'DemoSeed@123',
    [int]$UserTarget = 10,
    [int]$ClientTarget = 12,
    [int]$JobTarget = 24,
    [int]$CandidateTarget = 24,
    [int]$SubmissionTarget = 24,
    [int]$InterviewTarget = 18,
    [int]$OfferTarget = 10
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Invoke-JsonApi {
    param(
        [ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        $Body = $null
    )

    try {
        if ($null -ne $Body) {
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 20)
        }

        return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
    }
    catch {
        $message = $_.Exception.Message
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            $message = "${message} | ${($_.ErrorDetails.Message)}"
        }
        throw "API call failed: $Method $Url :: $message"
    }
}

function Get-ApiData {
    param($Response)

    if ($null -eq $Response) { return $null }
    if ($Response.PSObject.Properties.Name -contains 'data') {
        return $Response.data
    }

    return $Response
}

function Get-IdValue {
    param($Object)

    if ($null -eq $Object) { return $null }
    if ($Object.PSObject.Properties.Name -contains 'id') { return $Object.id }
    if ($Object.PSObject.Properties.Name -contains 'submission_id') { return $Object.submission_id }

    return $null
}

$seedTag = (Get-Date -Format 'yyyyMMddHHmmss')
Write-Host "Seed tag: $seedTag" -ForegroundColor Yellow

Write-Step 'Login as super admin'
$saLogin = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/super-admin/auth/login" -Headers @{} -Body @{
    email = $SuperAdminEmail
    password = $SuperAdminPassword
}
$saToken = (Get-ApiData $saLogin).accessToken
if (-not $saToken) {
    throw 'Unable to get super admin token.'
}
$saHeaders = @{ Authorization = "Bearer $saToken" }

Write-Step 'Locate target demo company'
$companiesResponse = Invoke-JsonApi -Method 'GET' -Url "$BaseUrl/api/super-admin/companies?page=1&limit=500" -Headers $saHeaders
$companies = (Get-ApiData $companiesResponse).companies
if (-not $companies) {
    throw 'No companies returned by super admin API.'
}

$targetCompany = $companies | Where-Object {
    ($_.name -as [string]).ToLower().Contains($TargetCompanyKeyword.ToLower()) -or
    ($_.slug -as [string]).ToLower().Contains($TargetCompanyKeyword.ToLower())
} | Select-Object -First 1

if (-not $targetCompany) {
    throw "No company matched keyword '$TargetCompanyKeyword'."
}

$companyId = $targetCompany.id
Write-Host "Target company: $($targetCompany.name) ($($targetCompany.slug)) | ID=$companyId" -ForegroundColor Green

Write-Step 'Fetch demo company admins and set deterministic password'
$adminsResponse = Invoke-JsonApi -Method 'GET' -Url "$BaseUrl/api/super-admin/companies/$companyId/admins" -Headers $saHeaders
$admins = (Get-ApiData $adminsResponse).admins
if (-not $admins -or $admins.Count -eq 0) {
    throw 'No admin user found for the target company.'
}

$primaryAdmin = $admins | Select-Object -First 1
$resolvedDemoAdminPassword = $null

try {
    Invoke-JsonApi -Method 'PATCH' -Url "$BaseUrl/api/super-admin/companies/$companyId/admins/$($primaryAdmin.id)" -Headers $saHeaders -Body @{
        password = $DemoAdminPassword
    } | Out-Null

    $resolvedDemoAdminPassword = $DemoAdminPassword
    Write-Host "Primary admin password reset for $($primaryAdmin.email)" -ForegroundColor Green
}
catch {
    Write-Host "Password reset endpoint failed, attempting login with known passwords..." -ForegroundColor Yellow
    $candidatePasswords = @($DemoAdminPassword, 'Admin@123', 'DemoAdmin@123', 'ChangeMe@123')

    foreach ($p in $candidatePasswords) {
        try {
            $tryLogin = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/v1/auth/login" -Headers @{} -Body @{
                email = $primaryAdmin.email
                password = $p
            }

            if ((Get-ApiData $tryLogin).token -or (Get-ApiData $tryLogin).accessToken) {
                $resolvedDemoAdminPassword = $p
                Write-Host "Found working demo admin password for $($primaryAdmin.email)" -ForegroundColor Green
                break
            }
        }
        catch {
            # Continue trying next candidate password.
        }
    }

    if (-not $resolvedDemoAdminPassword) {
        throw 'Could not reset password and no known demo admin password worked.'
    }
}

Write-Step 'Ensure at least target user count in demo company'
$existingAdminCount = $admins.Count
$usersToCreate = [Math]::Max(0, $UserTarget - $existingAdminCount)
$createdUsers = @()

for ($i = 1; $i -le $usersToCreate; $i++) {
    $idx = $existingAdminCount + $i
    $email = "demo.user$idx.$seedTag@example.com"
    $newUser = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/super-admin/companies/$companyId/admins" -Headers $saHeaders -Body @{
        firstName = 'Demo'
        lastName = "User$idx"
        email = $email
        password = $DemoAdminPassword
        role = 'admin'
    }

    $createdUsers += (Get-ApiData $newUser)
}
Write-Host "Users created: $($createdUsers.Count)" -ForegroundColor Green

Write-Step 'Login as demo company admin'
$demoLogin = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/v1/auth/login" -Headers @{} -Body @{
    email = $primaryAdmin.email
    password = $resolvedDemoAdminPassword
}
$demoData = Get-ApiData $demoLogin
$demoToken = if ($demoData.accessToken) { $demoData.accessToken } else { $demoData.token }
if (-not $demoToken) {
    throw 'Unable to login as demo admin.'
}
$bizHeaders = @{ Authorization = "Bearer $demoToken" }

Write-Step 'Probe candidates endpoint availability'
try {
    Invoke-JsonApi -Method 'GET' -Url "$BaseUrl/api/v1/candidates?page=1&limit=1" -Headers $bizHeaders | Out-Null
}
catch {
    throw "Candidates API is not available on the running backend. Please restart backend with latest code and rerun this script. Error: $($_.Exception.Message)"
}

$industries = @('FinTech', 'Healthcare', 'Retail', 'Logistics', 'Manufacturing', 'EdTech')
$departments = @('Engineering', 'Data', 'QA', 'Product', 'Operations')
$cities = @('Hyderabad', 'Bengaluru', 'Chennai', 'Pune', 'Mumbai', 'Noida')
$skillsPool = @('Java', 'Spring Boot', 'Node.js', 'React', 'TypeScript', 'Python', 'SQL', 'AWS', 'Docker', 'Kubernetes')
$interviewTypes = @('phone', 'video', 'onsite')

Write-Step 'Create clients'
$createdClients = @()
for ($i = 1; $i -le $ClientTarget; $i++) {
    $clientPayload = @{
        name = "Demo Client $seedTag-$i"
        code = "DC$($seedTag.Substring($seedTag.Length - 4))$i"
        contact_person = "Contact $i"
        email = "client$i.$seedTag@example.com"
        phone = "90000$('{0:d5}' -f $i)"
        city = $cities[($i - 1) % $cities.Count]
        country = 'India'
        industry = $industries[($i - 1) % $industries.Count]
        status = 'active'
        is_active = $true
        notes = 'Seeded demo client data'
    }

    $resp = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/v1/clients" -Headers $bizHeaders -Body $clientPayload
    $entity = Get-ApiData $resp
    $createdClients += $entity
}
Write-Host "Clients created: $($createdClients.Count)" -ForegroundColor Green

Write-Step 'Create jobs linked to clients'
$createdJobs = @()
for ($i = 1; $i -le $JobTarget; $i++) {
    $client = $createdClients[($i - 1) % $createdClients.Count]
    $skillA = $skillsPool[($i - 1) % $skillsPool.Count]
    $skillB = $skillsPool[$i % $skillsPool.Count]

    $jobPayload = @{
        title = "Senior $skillA Engineer $i"
        description = "Demo job $i focused on $skillA and $skillB for enterprise delivery."
        requirements = "Strong $skillA, $skillB, communication, and problem solving."
        department = $departments[($i - 1) % $departments.Count]
        location = $cities[($i - 1) % $cities.Count]
        status = 'open'
        employment_type = 'full-time'
        salary_min = 800000 + ($i * 10000)
        salary_max = 1400000 + ($i * 15000)
        client_id = $client.id
        required_skills = @($skillA, $skillB)
        preferred_skills = @('SQL', 'AWS')
        tags = @('seed', 'demo')
    }

    $resp = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/v1/jobs" -Headers $bizHeaders -Body $jobPayload
    $entity = Get-ApiData $resp
    $createdJobs += $entity
}
Write-Host "Jobs created: $($createdJobs.Count)" -ForegroundColor Green

Write-Step 'Create candidates'
$createdCandidates = @()
for ($i = 1; $i -le $CandidateTarget; $i++) {
    $skillA = $skillsPool[($i - 1) % $skillsPool.Count]
    $skillB = $skillsPool[$i % $skillsPool.Count]

    $candidatePayload = @{
        candidate_name = "Candidate $seedTag-$i"
        email = "candidate$i.$seedTag@example.com"
        phone = "80000$('{0:d5}' -f $i)"
        total_experience = 2 + ($i % 10)
        relevant_experience = 1 + ($i % 8)
        current_company = "Company $i"
        notice_period = '30 days'
        location_preference = $cities[($i - 1) % $cities.Count]
        candidate_status = 'Active'
        skill_set = "$skillA, $skillB"
        notes = 'Seeded demo candidate data'
    }

    $resp = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/v1/candidates" -Headers $bizHeaders -Body $candidatePayload
    $entity = Get-ApiData $resp
    $createdCandidates += $entity
}
Write-Host "Candidates created: $($createdCandidates.Count)" -ForegroundColor Green

Write-Step 'Create submissions linked to jobs and candidates'
$createdSubmissions = @()
$submissionCount = [Math]::Min($SubmissionTarget, [Math]::Min($createdCandidates.Count, $createdJobs.Count))
for ($i = 1; $i -le $submissionCount; $i++) {
    $candidate = $createdCandidates[$i - 1]
    $job = $createdJobs[($i - 1) % $createdJobs.Count]

    $candidateId = [int]$candidate.id
    $submissionPayload = @{
        candidate_id = $candidateId
        job_id = $job.id
        cover_letter = "Candidate $candidateId is a strong match for job $($job.id)."
        salary_expectation = 900000 + ($i * 12000)
        notes = @{ source = 'demo-seed'; batch = $seedTag }
    }

    $resp = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/v1/submissions" -Headers $bizHeaders -Body $submissionPayload
    $entity = Get-ApiData $resp
    $createdSubmissions += $entity
}
Write-Host "Submissions created: $($createdSubmissions.Count)" -ForegroundColor Green

Write-Step 'Create interviews (scheduled records) linked to submissions'
$createdInterviews = @()
$interviewCount = [Math]::Min($InterviewTarget, $createdSubmissions.Count)
for ($i = 1; $i -le $interviewCount; $i++) {
    $submission = $createdSubmissions[$i - 1]
    $start = (Get-Date).Date.AddDays($i).AddHours(10 + ($i % 5))
    $end = $start.AddMinutes(45)

    $interviewPayload = @{
        submission_id = $submission.id
        interview_type = $interviewTypes[($i - 1) % $interviewTypes.Count]
        scheduled_start = $start.ToString('o')
        scheduled_end = $end.ToString('o')
        location_or_link = "https://meet.example.com/demo-$seedTag-$i"
        notes = 'Seeded demo interview schedule'
    }

    $resp = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/v1/interviews" -Headers $bizHeaders -Body $interviewPayload
    $entity = Get-ApiData $resp
    $createdInterviews += $entity
}
Write-Host "Interviews created: $($createdInterviews.Count)" -ForegroundColor Green

Write-Step 'Create offers linked to submissions'
$createdOffers = @()
$offerCount = [Math]::Min($OfferTarget, $createdSubmissions.Count)
for ($i = 1; $i -le $offerCount; $i++) {
    $submission = $createdSubmissions[$i - 1]
    $offerDate = (Get-Date).Date.AddDays($i)
    $joiningDate = $offerDate.AddDays(30)

    $offerPayload = @{
        submission_id = $submission.id
        offer_number = "OFF-$seedTag-$i"
        offered_ctc = 1200000 + ($i * 25000)
        currency_code = 'INR'
        offer_date = $offerDate.ToString('yyyy-MM-dd')
        joining_date = $joiningDate.ToString('yyyy-MM-dd')
        notes = 'Seeded demo offer'
    }

    $resp = Invoke-JsonApi -Method 'POST' -Url "$BaseUrl/api/v1/offers" -Headers $bizHeaders -Body $offerPayload
    $entity = Get-ApiData $resp
    $createdOffers += $entity
}
Write-Host "Offers created: $($createdOffers.Count)" -ForegroundColor Green

Write-Step 'Seed summary'
$summary = [ordered]@{
    seedTag = $seedTag
    company = [ordered]@{
        id = $companyId
        name = $targetCompany.name
        slug = $targetCompany.slug
    }
    created = [ordered]@{
        users = $createdUsers.Count
        clients = $createdClients.Count
        jobs = $createdJobs.Count
        candidates = $createdCandidates.Count
        submissions = $createdSubmissions.Count
        interviews = $createdInterviews.Count
        offers = $createdOffers.Count
    }
}

$summary | ConvertTo-Json -Depth 10
