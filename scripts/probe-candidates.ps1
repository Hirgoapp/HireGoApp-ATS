$ErrorActionPreference = 'Stop'

$base = 'http://192.168.10.4:3001'
$login = Invoke-RestMethod -Uri "$base/api/v1/auth/login" -Method POST -ContentType 'application/json' -Body (@{ email='Sandeep@demo.com'; password='Admin@123' } | ConvertTo-Json)
$token = if ($login.data.accessToken) { $login.data.accessToken } else { $login.data.token }
$headers = @{ Authorization = "Bearer $token" }

$urls = @(
    "$base/api/v1/candidates?page=1&limit=1",
    "$base/api/v1/candidates?skip=0&take=1",
    "$base/api/v1/candidates/stats",
    "$base/api/v1/candidates/stats/count"
)

foreach ($u in $urls) {
    try {
        $res = Invoke-RestMethod -Uri $u -Headers $headers -Method GET -TimeoutSec 30
        Write-Host "OK $u" -ForegroundColor Green
        ($res | ConvertTo-Json -Depth 8)
    }
    catch {
        Write-Host "FAIL $u" -ForegroundColor Red
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
        else {
            Write-Host $_.Exception.Message
        }
    }
}
