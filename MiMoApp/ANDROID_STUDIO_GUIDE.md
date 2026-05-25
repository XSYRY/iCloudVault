### 在 Android Studio 中运行 MiMo 相册

#### 1. 打开项目

1. 打开 Android Studio
2. 选择 `Open` → 导航到 `c:\Users\voania\Desktop\iCloudVault\MiMoApp\android`
3. 等待 Gradle 同步完成

#### 2. 配置检查

确保以下配置正确：

**local.properties**（已配置）：
```properties
sdk.dir=C:\\Users\\voania\\AppData\\Local\\Android\\Sdk
```

**build.gradle**（项目级）：
```gradle
buildToolsVersion = "36.1.0"
minSdkVersion = 24
compileSdkVersion = 36
targetSdkVersion = 36
```

#### 3. 运行步骤

1. **启动 Metro 服务器**（终端）：
```bash
cd c:\Users\voania\Desktop\iCloudVault\MiMoApp
npx react-native start --port 8081
```

2. **启动模拟器**：
   - 打开 Android Studio 的 Device Manager
   - 选择 `Pixel_10_Pro` 模拟器
   - 点击启动按钮

3. **运行应用**：
   - 在 Android Studio 中选择 `app` 模块
   - 点击工具栏的 **Run** 按钮（绿色三角形）
   - 选择已连接的设备

#### 4. 故障排除

**Gradle 同步失败**：
- 清理缓存：`File` → `Invalidate Caches...` → `Invalidate and Restart`
- 重新同步：点击 `Sync Project with Gradle Files`

**设备未找到**：
- 确保模拟器已启动
- 检查 `adb devices` 命令输出
- 重启 ADB：`adb kill-server && adb start-server`

**Metro 连接失败**：
- 确保 Metro 服务器在端口 8081 运行
- 在模拟器中按 `Ctrl + M`（Windows）打开调试菜单
- 选择 `Reload` 或 `Debug JS Remotely`

#### 5. 项目结构

```
MiMoApp/
├── android/                    # Android 模块
│   ├── app/                   # 应用代码
│   ├── build.gradle           # 项目级配置
│   └── local.properties       # SDK 路径
├── ios/                       # iOS 模块
├── src/                       # React Native 源代码
│   ├── screens/               # 27 个屏幕组件
│   ├── components/            # 30+ UI 组件
│   ├── services/              # 8 个服务模块
│   ├── store/                 # Zustand 状态管理
│   └── navigation/            # React Navigation
└── package.json               # 依赖配置
```

#### 6. 功能清单

| 模块 | 功能 |
|------|------|
| 照片管理 | 网格/时间线/地图/分类视图 |
| AI 分析 | ML Kit 标签/人脸检测 |
| 编辑器 | 调整/滤镜/裁剪/标注 |
| 故事生成 | 智能分组 + 转场动画 |
| 备份恢复 | JSON 格式备份 |
| 标签管理 | 标签云 + 重命名/合并 |
| 视频支持 | 全屏播放器 |
| 打印服务 | 6 种布局选择 |

#### 7. 启动脚本

创建 `run_mimo.bat` 在项目根目录：

```batch
@echo off
echo Starting Metro server...
start cmd /k "cd c:\Users\voania\Desktop\iCloudVault\MiMoApp && npx react-native start --port 8081"

echo Waiting for Metro...
timeout /t 5 /nobreak

echo Starting emulator...
start "" "C:\Users\voania\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Pixel_10_Pro

echo Done! Open Android Studio and run the app.
```

---

**注意**：首次运行可能需要下载额外的 Gradle 依赖和构建工具，耐心等待即可。