# MiMo 项目规则

## 代码规范
- TypeScript strict 模式，禁止 `any`
- 组件用 `function` 声明，不用箭头函数
- Store 切片放在 `src/store/`，通过 barrel `index.ts` 导出
- 新组件优先放 `src/components/shared/`，除非明确属于特定模块

## 文件命名
- 屏幕: `XxxScreen.tsx`
- 组件: `XxxComponent.tsx` 或 `XxxModal.tsx`
- Store: `xxxStore.ts`
- Hook: `useXxx.ts`
- 工具: `xxx.ts`
- 每层都要有 `index.ts` barrel 导出

## 导入顺序
1. React / react-native
2. 第三方库
3. 项目内模块（通过 `../` 相对路径）
4. 类型导入放最后

## 构建
- 改完代码后运行 `npx tsc --noEmit` 验证
- Android 构建: `cd android && bash gradlew assembleDebug`
- 环境变量: `ANDROID_HOME=C:\Users\voania\AppData\Local\Android\Sdk`, `JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`

## 禁止
- 不要修改 `android/local.properties`
- 不要提交 `build/`、`node_modules/`、`.gradle/`
- 不要用 `git add -A`（会误提交大型二进制文件）
- 不要装新 npm 包除非明确需要
