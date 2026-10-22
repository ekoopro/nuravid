@echo off
cd /d d:\NURA\nura-vid
start "" /b cmd /c "npm run dev > dev-server.log 2> dev-server.err.log"
exit 0