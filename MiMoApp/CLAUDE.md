# Momento 相册 — React Native App

## 开发环境
- 项目路径：`C:\Users\voania\Desktop\iCloudVault\MiMoApp`
- Node.js ≥ 22.11，npm 已装
- Java 17（构建用）：`C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`
- Java 21（Android Studio JBR）：`C:\Program Files\Android\Android Studio\jbr`（AGP 7.4.2 不兼容，构建请用 JDK 17）
- Android SDK：`C:\Users\voania\AppData\Local\Android\Sdk`
- 模拟器：Pixel 10 Pro (AVD 名: `Pixel_10_Pro`)
- Metro：`npx react-native start`，端口 8081

## 快速启动
```bash
cd C:\Users\voania\Desktop\iCloudVault\MiMoApp
# 启动模拟器 + Metro + 构建 + 安装：
cd android && export ANDROID_HOME="C:\Users\voania\AppData\Local\Android\Sdk" && export JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot" && bash gradlew assembleDebug
# 模拟器：
C:\Users\voania\AppData\Local\Android\Sdk\emulator\emulator.exe -avd Pixel_10_Pro
# 安装：
C:\Users\voania\AppData\Local\Android\Sdk\platform-tools\adb.exe -s emulator-5554 install android/app/build/outputs/apk/debug/app-debug.apk
```

## 技术栈
React Native 0.72.10 (Hermes, old arch) · TypeScript 5.4 · React Navigation 6 · Zustand 4 · react-native-paper 5 (MD3) · reanimated 3.5 · Metro

## 项目结构
- `src/screens/` — 23 个屏幕
- `src/components/` — 28 个组件
- `src/store/` — 5 个 Zustand 切片
- `src/ai/` — AI 管线（NLU、dedup、embedding）
- `src/db/` — WatermelonDB schema（mock 阶段）
- `android/` — Android 原生配置

## 关键文件
- `PROJECT_OVERVIEW.md` — 完整项目文档和接口速查
- `src/types/index.ts` — 所有 TS 类型定义
- `src/navigation/RootNavigator.tsx` — 导航结构
- `src/store/settingsStore.ts` — 设置（主题/PIN/网格列数）

## 已知修改
- `android/build.gradle`：buildTools 36.1.0, compileSdk/targetSdk 36
- `android/gradle/wrapper/gradle-wrapper.properties`：Gradle 8.13 阿里云镜像
- `android/settings.gradle`：添加了阿里云 Maven 镜像
- `android/gradle.properties`：启用 Jetifier（push-notification 的旧 support 库→AndroidX）
- `src/store/settingsStore.ts`：MMKV 持久化（需 nitro-modules 直接依赖）
- `package.json`：添加 react-native-nitro-modules 为直接依赖（mmkv 的传递依赖不被自动链接）

## Phase 当前进度
- **Masonry 瀑布流**（Phase 1-4）：全部完成 ✅
- **视频播放 & 实况照片优化**（5 Phase）：**Phase 1-5（含缩略图预加载、动态照片真机导入与 AI 去重打通）全部完成 ✅**
- 详细计划见：`C:\Users\voania\.claude\plans\structured-jumping-sifakis.md` 和 [walkthrough.md](file:///C:/Users/voania/.gemini/antigravity/brain/705dcedc-97bf-4d44-afe6-408d457241fb/walkthrough.md)

**构建**: 必须用 JDK 17（`C:/Program Files/Microsoft/jdk-17.0.19.10-hotspot`），JDK 21 不兼容 AGP 7.4.2
