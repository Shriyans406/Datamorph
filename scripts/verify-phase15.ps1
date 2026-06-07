$base = "http://localhost:3000"
$pass = 0
$fail = 0

function Test-Result($name, $ok, $detail) {
    if ($ok) {
        Write-Host "  [PASS] $name" -ForegroundColor Green
        Write-Host "         $detail" -ForegroundColor DarkGray
        $script:pass++
    } else {
        Write-Host "  [FAIL] $name" -ForegroundColor Red
        Write-Host "         $detail" -ForegroundColor DarkGray
        $script:fail++
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Phase 15 - Deployment Verification  " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# --- TEST 1: Health endpoint returns healthy ---
Write-Host "TEST 1: Health Endpoint (/api/health)" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$base/api/health" -UseBasicParsing -TimeoutSec 10
    $body = $r.Content | ConvertFrom-Json
    $ok = ($r.StatusCode -eq 200) -and ($body.status -eq "healthy")
    Test-Result "GET /api/health returns 200 + healthy status" $ok "HTTP $($r.StatusCode) | status=$($body.status) | db=$($body.services.database)"
} catch {
    Test-Result "GET /api/health" $false $_.Exception.Message
}

Write-Host ""

# --- TEST 2: Backup endpoint rejects without token (401) ---
Write-Host "TEST 2: Backup Auth Rejection (no token)" -ForegroundColor Yellow
try {
    $r2 = Invoke-WebRequest -Uri "$base/api/deployment/backup" -Method POST -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    Test-Result "POST /api/deployment/backup without token returns 401" ($r2.StatusCode -eq 401) "HTTP $($r2.StatusCode)"
} catch {
    # 401 causes an exception in PowerShell's Invoke-WebRequest
    $statusCode = $_.Exception.Response.StatusCode.value__
    $ok = ($statusCode -eq 401)
    Test-Result "POST /api/deployment/backup without token returns 401" $ok "HTTP $statusCode (exception caught as expected)"
}

Write-Host ""

# --- TEST 3: Backup endpoint succeeds with correct token ---
Write-Host "TEST 3: Backup Succeeds With Token" -ForegroundColor Yellow
try {
    $headers3 = @{ "Authorization" = "Bearer fallback_dev_secret_123" }
    $r3 = Invoke-WebRequest -Uri "$base/api/deployment/backup" -Method POST -Headers $headers3 -UseBasicParsing -TimeoutSec 10
    $body3 = $r3.Content | ConvertFrom-Json
    $ok3 = ($r3.StatusCode -eq 200) -and ($body3.success -eq $true)
    Test-Result "POST /api/deployment/backup with valid token returns success" $ok3 "HTTP $($r3.StatusCode) | success=$($body3.success) | collections=$($body3.backedUpCollections -join ', ')"
} catch {
    Test-Result "POST /api/deployment/backup with valid token" $false $_.Exception.Message
}

Write-Host ""

# --- TEST 4: Security headers present ---
Write-Host "TEST 4: Security Headers on Response" -ForegroundColor Yellow
try {
    $r4 = Invoke-WebRequest -Uri "$base/" -UseBasicParsing -TimeoutSec 10
    $headers = $r4.Headers

    $csp      = $headers["Content-Security-Policy"]
    $hsts     = $headers["Strict-Transport-Security"]
    $xframe   = $headers["X-Frame-Options"]
    $xcto     = $headers["X-Content-Type-Options"]

    Test-Result "Content-Security-Policy header present" ($null -ne $csp -and $csp -ne "") "Value: $csp"
    Test-Result "X-Frame-Options: DENY present"          ($xframe -eq "DENY")             "Value: $xframe"
    Test-Result "X-Content-Type-Options: nosniff present" ($xcto -eq "nosniff")           "Value: $xcto"
    Test-Result "Strict-Transport-Security present"       ($null -ne $hsts -and $hsts -ne "") "Value: $hsts"
} catch {
    Test-Result "Security headers check" $false $_.Exception.Message
}

Write-Host ""

# --- TEST 5: Deployment lab page loads (200) ---
Write-Host "TEST 5: Deployment Lab Page Loads" -ForegroundColor Yellow
try {
    $r5 = Invoke-WebRequest -Uri "$base/deployment-lab" -UseBasicParsing -TimeoutSec 10
    $ok5 = ($r5.StatusCode -eq 200) -and ($r5.Content -like "*SaaS Production Deployment Control*")
    Test-Result "GET /deployment-lab returns 200 with expected content" $ok5 "HTTP $($r5.StatusCode) | Content match: $ok5"
} catch {
    Test-Result "GET /deployment-lab" $false $_.Exception.Message
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Results: $pass PASSED | $fail FAILED  " -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
