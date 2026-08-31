# FCM Push Notification Test Script
# This script tests if FCM push notifications are working

Write-Host "===========================================`n" -ForegroundColor Cyan
Write-Host "    FCM Push Notification Test Script     `n" -ForegroundColor Cyan
Write-Host "===========================================`n" -ForegroundColor Cyan

Write-Host "Make sure Chrome browser is open with your app running!`n" -ForegroundColor Yellow
Write-Host "URL: http://localhost:5173`n" -ForegroundColor Yellow

$response = Read-Host "Press ENTER to continue or Ctrl+C to cancel"

Write-Host "`nRunning test...`n" -ForegroundColor Green

# Run the PHP test script
php test_fcm_notification.php

Write-Host "`n"
Write-Host "===========================================`n" -ForegroundColor Cyan
Write-Host "Test completed! Check the output above.`n" -ForegroundColor Cyan
Write-Host "===========================================`n" -ForegroundColor Cyan

Read-Host "Press ENTER to exit"
