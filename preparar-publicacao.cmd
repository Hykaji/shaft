@echo off
title Modo Eixo - Preparar publicação
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\preparar-publicacao.ps1"
echo.
pause
