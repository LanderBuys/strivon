@echo off
cd /d "%~dp0"
node -e "const fs=require('fs'),p=require('path'),b=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==','base64'),d=p.join(__dirname,'assets');['icon.png','splash.png','adaptive-icon.png','favicon.png'].forEach(function(f){try{fs.writeFileSync(p.join(d,f),b);console.log('Created: '+f);}catch(e){console.error('Error: '+e.message);}});"
pause
