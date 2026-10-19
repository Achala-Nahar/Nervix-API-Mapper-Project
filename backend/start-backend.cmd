@echo off
setlocal
cd /d "%~dp0"
call mvnw.cmd clean test
if errorlevel 1 exit /b 1
call mvnw.cmd -Dspring-boot.run.profiles=local spring-boot:run
if errorlevel 1 exit /b 1
