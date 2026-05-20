# iCloudVault

独立于系统相册的 iCloud 私人相册管理应用 —— 基于 MiMo-V2.5 多模态 AI 自动分类、搜索、去重。

## 痛点

iOS 用户将照片存入 iCloud Drive 后，只能通过"文件"App 查看，无法像系统相册一样按时间线浏览、按内容搜索、自动分类、去重。系统相册与 iCloud Drive 照片完全割裂。

## 特性

- **iCloud Drive 直读**：访问 iCloud Drive 指定文件夹，与系统相册完全隔离
- **AI 智能分类**：多模态模型自动打标签（人物、场景、物体、OCR 文字提取）
- **自然语言搜索**：支持"去年在海边拍的日落"级别语义搜索
- **时间线 + 地图**：EXIF 元数据提取，时空双维度浏览
- **去重引擎**：感知哈希 + 特征向量相似度，识别重复/相似照片
- **端到端加密**：照片不出 iCloud，AI 分析在本地完成，仅上传特征向量

## 技术栈

| 层 | 技术 |
|------|------|
| iOS 客户端 | SwiftUI + FileManager + iCloud Entitlement |
| 后端 | Vapor (Swift) / Cloudflare Workers |
| AI 推理 | MiMo-V2.5-Pro（多模态标签 + OCR） |
| 向量检索 | FAISS / USearch |
| 去重 | pHash + CLIP 特征相似度 |

## 开发方式

全流程 **Agent 驱动开发**：Claude Code 调度 + MiMo-V2.5 推理。工作流覆盖需求分析→架构设计→模块子代理并行实现→代码审查→TDD。

## 路线图

- [ ] **Phase 1**：iCloud 同步层 + 基础相册 UI（瀑布流、时间线）
- [ ] **Phase 2**：MiMo-V2.5 多模态分类引擎 + 标签系统
- [ ] **Phase 3**：自然语言语义搜索
- [ ] **Phase 4**：去重引擎
- [ ] **Phase 5**：Web 端（电脑浏览）
- [ ] **Phase 6**：端到端加密 + 隐私保护

## 状态

🚧 早期开发中 | 预计 2026 Q3 发布 MVP

## 许可证

MIT
