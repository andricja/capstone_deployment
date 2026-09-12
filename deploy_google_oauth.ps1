# PowerShell Script for Google OAuth Deployment
# Windows-friendly version

Write-Host "=== Google OAuth Credential Deployment ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will SSH into your server and update credentials" -ForegroundColor Yellow
Write-Host "Credentials are NOT stored in files - only in server .env" -ForegroundColor Yellow
Write-Host ""

# Prompt for server details
$serverHost = Read-Host "Server hostname (e.g., ferms.net)"
$sshUser = Read-Host "SSH username"
$backendPath = Read-Host "Backend path (e.g., domains/ferms.net/public_html/capstone_backend)"

Write-Host ""
Write-Host "--- Enter Google OAuth Credentials ---" -ForegroundColor Green
$clientId = Read-Host "Google Client ID"
$clientSecretSecure = Read-Host "Google Client Secret" -AsSecureString
$clientSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecretSecure)
)
$redirectUri = Read-Host "Redirect URI (default: https://ferms.net/api/auth/google/callback)"
if ([string]::IsNullOrEmpty($redirectUri)) {
    $redirectUri = "https://ferms.net/api/auth/google/callback"
}

Write-Host ""
Write-Host "--- Credentials Summary ---" -ForegroundColor Yellow
Write-Host "Client ID: $clientId"
Write-Host "Client Secret: $($clientSecret.Substring(0, [Math]::Min(10, $clientSecret.Length)))..."
Write-Host "Redirect URI: $redirectUri"
Write-Host ""

$confirm = Read-Host "Continue with deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "=== Deploying to Server ===" -ForegroundColor Cyan

# Create the remote command
$remoteCommand = @"
cd $backendPath && \
cp .env .env.backup.\$(date +%Y%m%d_%H%M%S) && \
echo '✓ Backed up .env' && \
sed -i 's|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$clientId|' .env && \
sed -i 's|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$clientSecret|' .env && \
sed -i 's|^GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=$redirectUri|' .env && \
echo '✓ Updated .env file' && \
php artisan config:clear && \
php artisan cache:clear && \
php artisan optimize:clear && \
echo '✓ Cleared Laravel caches' && \
killall -9 lsphp 2>/dev/null || true && \
touch ~/.lsphp_restart.txt 2>/dev/null || true && \
echo '✓ Restarted PHP' && \
echo '' && \
echo '=== Verification ===' && \
grep 'GOOGLE_CLIENT_ID' .env | head -c 60 && \
echo '...' && \
grep 'GOOGLE_REDIRECT_URI' .env && \
echo '' && \
echo '✓ Deployment complete!'
"@

# Execute via SSH
try {
    $sshCommand = "ssh $sshUser@$serverHost `"$remoteCommand`""
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== ✅ SUCCESS ===" -ForegroundColor Green
        Write-Host "Google OAuth credentials deployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Test OAuth at: https://$serverHost"
        Write-Host "2. Verify redirect URI in Google Cloud Console"
        Write-Host "3. Check Laravel logs if issues occur"
    } else {
        throw "SSH command failed"
    }
} catch {
    Write-Host ""
    Write-Host "=== ❌ ERROR ===" -ForegroundColor Red
    Write-Host "Deployment failed. Check SSH connection and paths." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
