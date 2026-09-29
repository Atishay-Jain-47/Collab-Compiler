@echo off
cd /d "%~dp0"
if defined JAVA_HOME goto check_node
if exist "C:\Users\atish\.jdks\corretto-21.0.11" (
    set "JAVA_HOME=C:\Users\atish\.jdks\corretto-21.0.11"
    set "PATH=%JAVA_HOME%\bin;%PATH%"
)
:check_node
if exist "C:\Program Files\nodejs" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)
.\mvnw.cmd spring-boot:run
