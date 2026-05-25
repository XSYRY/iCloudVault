@echo off
setlocal enabledelayedexpansion

title MiMoApp Build Script

:: 检查参数
if "%1"=="" goto usage
if "%1"=="debug" goto debug
if "%1"=="release" goto release
if "%1"=="clean" goto clean
if "%1"=="version" goto version
goto usage

:debug
echo ====================
echo Building DEBUG APK
echo ====================
echo.

:: 清理旧构建
echo [1/4] Cleaning build...
cd android
call gradlew clean
if %errorlevel% neq 0 goto error
cd ..

:: 构建Debug
echo [2/4] Building debug APK...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 goto error
cd ..

:: 复制APK
echo [3/4] Copying APK...
copy android\app\build\outputs\apk\debug\app-debug.apk .\build\debug\ /y
if %errorlevel% neq 0 goto error

echo [4/4] Build completed successfully!
echo.
echo APK location: .\build\debug\app-debug.apk
goto end

:release
echo ====================
echo Building RELEASE APK
echo ====================
echo.

:: 检查是否有签名文件
if not exist "android\app\mimo-release-key.jks" (
    echo ERROR: Signing key not found!
    echo Please place mimo-release-key.jks in android/app/
    goto error
)

:: 清理旧构建
echo [1/5] Cleaning build...
cd android
call gradlew clean
if %errorlevel% neq 0 goto error
cd ..

:: 生成Bundle
echo [2/5] Generating bundle...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
if %errorlevel% neq 0 goto error

:: 构建Release
echo [3/5] Building release APK...
cd android
call gradlew assembleRelease
if %errorlevel% neq 0 goto error
cd ..

:: 复制APK
echo [4/5] Copying APK...
copy android\app\build\outputs\apk\release\app-release.apk .\build\release\ /y
if %errorlevel% neq 0 goto error

echo [5/5] Build completed successfully!
echo.
echo APK location: .\build\release\app-release.apk
goto end

:clean
echo ====================
echo Cleaning build artifacts
echo ====================
echo.

echo Cleaning Android build...
cd android
call gradlew clean
cd ..

echo Cleaning node modules...
rmdir /s /q node_modules

echo Cleaning package-lock.json...
del package-lock.json

echo Clean completed!
goto end

:version
echo ====================
echo Version Management
echo ====================
echo.

if "%2"=="" goto version_usage
if "%2"=="patch" goto version_patch
if "%2"=="minor" goto version_minor
if "%2"=="major" goto version_major

:version_usage
echo Usage: build.bat version [patch^|minor^|major]
goto end

:version_patch
echo Bumping patch version...
call npm version patch
goto end

:version_minor
echo Bumping minor version...
call npm version minor
goto end

:version_major
echo Bumping major version...
call npm version major
goto end

:usage
echo ====================
echo MiMoApp Build Script
echo ====================
echo.
echo Usage: build.bat [command]
echo.
echo Commands:
echo   debug    - Build debug APK
echo   release  - Build release APK
echo   clean    - Clean build artifacts
echo   version  - Version management
echo.
echo Example:
echo   build.bat debug
echo   build.bat release
echo   build.bat version patch
goto end

:error
echo.
echo ====================
echo ERROR: Build failed!
echo ====================
exit /b 1

:end
endlocal
pause
