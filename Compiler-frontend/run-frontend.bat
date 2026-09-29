@echo off
cd /d "%~dp0"
if exist "C:\Program Files\nodejs" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)
npm.cmd run dev
