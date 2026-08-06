@echo off
title Shaft - Preparar publicação
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\preparar-publicacao.ps1"
echo.
pause
