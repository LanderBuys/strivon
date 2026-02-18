@echo off
echo Creating placeholder asset files...

cd /d "%~dp0assets"

REM Create minimal valid PNG files (1x1 white pixel)
echo iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg== > temp.b64

certutil -decode temp.b64 icon.png >nul 2>&1
certutil -decode temp.b64 splash.png >nul 2>&1
certutil -decode temp.b64 adaptive-icon.png >nul 2>&1
certutil -decode temp.b64 favicon.png >nul 2>&1

del temp.b64

echo.
echo All asset files created successfully!
echo These are minimal placeholder images.
echo Replace them with your actual app icons before production.
pause






