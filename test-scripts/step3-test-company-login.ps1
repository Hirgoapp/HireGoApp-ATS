# Step 3: Test Company Admin Login

Write-Host "Testing company admin login..."

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' `
        -Method POST `
        -ContentType 'application/json' `
        -Body (ConvertTo-Json @{ 
            email = 'admin@demo-company.com'
            password = 'DemoAdmin@123'
        }) `
        -ErrorAction Stop
    
    Write-Host "`nSuccess!"
    Write-Host "`nFull response:"
    $result | ConvertTo-Json -Depth 10
    
    Write-Host "`nChecking token structure..."
    Write-Host "Result keys: $($result | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)"
    
    # Extract token from proper path
    $tokenData = $result.data
    if ($tokenData -and $tokenData.token) {
        $token = $tokenData.token
        Write-Host "`nToken found: $($token.Substring(0, 50))..."
        
        # Save token for next steps
        $token | Out-File -FilePath ".\test-scripts\company-admin-token.txt" -NoNewline
        Write-Host "`nToken saved to test-scripts\company-admin-token.txt"
        
        # Decode token payload
        $tokenParts = $token.Split('.')
        $payloadJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
        Write-Host "`nToken Payload:"
        $payloadJson | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } else {
        Write-Host "`nWarning: Could not find token in response"
    }
    
} catch {
    Write-Host "`nError occurred:"
    Write-Host $_.Exception.Message
    Write-Host "`nResponse body:"
    $_.ErrorDetails.Message
}
