@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title MiMo App Launcher
echo ===============================================
echo          MiMo 相册 - React Native 启动脚本
echo ===============================================
echo.

set "PROJECT_DIR=c:\Users\voania\Desktop\iCloudVault\MiMoApp"
set "ANDROID_HOME=C:\Users\voania\AppData\Local\Android\Sdk"
set "EMULATOR_AVD=Pixel_10_Pro"
set "METRO_PORT=8081"

rem 设置环境变量
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

echo [1/4] 检查项目目录...
if not exist "%PROJECT_DIR%\package.json" (
    echo ❌ 错误：项目目录不存在
    pause
    exit /b 1
)
echo ✅ 项目目录正常

echo.
echo [2/4] 启动 Metro 服务器...
start "Metro Server" cmd /k "cd %PROJECT_DIR% && npx react-native start --port %METRO_PORT%"

echo ⏳ 等待 Metro 启动...
timeout /t 10 /nobreak >nul

echo.
echo [3/4] 启动 Android 模拟器...
echo 正在启动 %EMULATOR_AVD%...
start "Emulator" "%ANDROID_HOME%\emulator\emulator.exe" -avd %EMULATOR_AVD% -no-boot-anim

echo ⏳ 等待模拟器启动...
timeout /t 30 /nobreak >nul

echo.
echo [4/4] 安装并运行应用...
cd %PROJECT_DIR%

:WAIT_FOR_DEVICE
echo 检查设备连接...
adb devices | findstr /r "^emulator.*device$" >nul
if errorlevel 1 (
    echo ⏳ 等待设备就绪...
    timeout /t 10 /nobreak >nul
    goto WAIT_FOR_DEVICE
)
echo ✅ 设备已连接

echo 安装应用...
npx react-native run-android --port %METRO_PORT%

echo.
echo ===============================================
echo                    启动完成！
echo ===============================================
echo.
echo 如果应用未自动启动：
echo 1. 确保模拟器已完全启动
echo 2. 在模拟器中打开 MiMo 应用
echo 3. 按 Ctrl+M 打开调试菜单，选择 Reload
echo.
pause