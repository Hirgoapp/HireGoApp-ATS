@echo off
echo Testing Candidate Creation API...
echo.
echo Step 1: Logging in...
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@demo-company.com\",\"password\":\"DemoAdmin@123\"}" -o login.json 2>nul
echo Login response saved to login.json
echo.
echo Step 2: Creating candidate (check server logs for errors)...
FOR /F "tokens=* USEBACKQ" %%F IN (`powershell -command "(Get-Content login.json | ConvertFrom-Json).data.token"`) DO (SET TOKEN=%%F)
curl -X POST http://localhost:3000/api/v1/candidates -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"first_name\":\"John\",\"last_name\":\"Doe\",\"email\":\"john.doe@test.com\",\"status\":\"active\"}"
echo.
echo Done
