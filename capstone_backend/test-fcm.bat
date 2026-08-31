@echo off
echo ===========================================
echo     FCM Push Notification Test Script     
echo ===========================================
echo.
echo Make sure Chrome browser is open with your app running!
echo URL: http://localhost:5173
echo.
pause
echo.
echo Running test...
echo.

php test_fcm_notification.php

echo.
echo ===========================================
echo Test completed! Check the output above.
echo ===========================================
echo.
pause
