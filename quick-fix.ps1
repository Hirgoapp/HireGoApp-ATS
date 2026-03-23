# Quick fix script to comment out modules with errors
# This allows the core app to start while we fix individual modules

Write-Host "🔧 Applying quick fixes to get the app running..." -ForegroundColor Yellow

# Comment out problematic imports in app.module.ts
Write-Host "  - Disabling reports module temporarily..." -ForegroundColor Gray

# The reports module has multiple missing dependencies
$appModulePath = "src\app.module.ts"
$content = Get-Content $appModulePath -Raw

if ($content -match "ReportModule") {
    $content = $content -replace "(import.*ReportModule.*)", "// $1 // TEMPORARILY DISABLED"
    $content = $content -replace "(\s+ReportModule,)", "    // ReportModule, // TEMPORARILY DISABLED"
    Set-Content $appModulePath $content
    Write-Host "    ✓ Reports module disabled" -ForegroundColor Green
}

# Comment out offers module
if ($content -match "OfferModule") {
    $content = Get-Content $appModulePath -Raw
    $content = $content -replace "(import.*OfferModule.*)", "// $1 // TEMPORARILY DISABLED"
    $content = $content -replace "(\s+OfferModule,)", "    // OfferModule, // TEMPORARILY DISABLED"
    Set-Content $appModulePath $content
    Write-Host "    ✓ Offers module disabled" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Quick fixes applied!" -ForegroundColor Green
Write-Host "   The app should now start with core features enabled." -ForegroundColor Gray
Write-Host "   Some features (Reports, Offers) are temporarily disabled." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Run the app again: npm run dev" -ForegroundColor Cyan
