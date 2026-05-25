# Momento 相册 — React Native 项目总览

**160+ 源文件 · 25000+ 行 TypeScript · strict 模式 · 零编译错误**

## 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 框架 | React Native (New Architecture) | 0.85.3 |
| 语言 | TypeScript (strict) | 5.9.3 |
| 导航 | React Navigation (native-stack + bottom-tabs) | 7.x |
| 状态管理 | Zustand (5 切片) | latest |
| UI 组件库 | react-native-paper (MD3) | latest |
| 动画 | react-native-reanimated | 3.x |
| 手势 | react-native-gesture-handler | 2.x |
| 图片选择 | react-native-image-picker | 7.x |
| 图片缩放 | @bam.tech/react-native-image-resizer | 3.x |
| 数据库 | @nozbe/watermelondb (SQLite) | latest |
| KV 存储 | react-native-mmkv | latest |
| 图标 | react-native-vector-icons | 10.x |
| 触感反馈 | react-native-haptic-feedback | latest |
| AI 标签 | @react-native-ml-kit/image-labeling | latest |
| AI 人脸 | @react-native-ml-kit/face-detection | latest |
| 图像处理 | @shopify/react-native-skia | latest |
| 地图 | react-native-maps | latest |
| 分享 | react-native-share | latest |
| AI 推理 | Google ML Kit + TFLite | ✅ 已接入 |

## 项目结构

```
MiMoApp/
├── App.tsx                          # GestureHandler → SafeArea → Paper → Theme → Navigation
├── index.js                         # RN 入口
├── babel.config.js                  # reanimated plugin
├── tsconfig.json                    # strict + baseUrl paths
├── package.json
├── PROJECT_OVERVIEW.md              # 本文件
├── src/
│   ├── types/
│   │   ├── index.ts                 # Photo, Album, ExifData, EditState, AiAnalysisResult...
│   │   └── react-native-push-notification.d.ts # 第三方库类型补丁 + TextEncoder
│   ├── store/
│   │   ├── index.ts                 # barrel
│   │   ├── photoStore.ts            # CRUD + 筛选 + 排序 + 多选 + 批量操作
│   │   ├── albumStore.ts            # CRUD + 智能相册规则引擎
│   │   ├── uiStore.ts               # Toast / Modal / Overlay / FAB / search / storyCache
│   │   ├── settingsStore.ts         # 主题 / 列数 / PIN / 搜索历史
│   │   └── aiStore.ts               # AI 管线状态 + 结果 Map
│   ├── db/
│   │   ├── index.ts                 # barrel
│   │   ├── schema.ts                # WatermelonDB 7 表 schema
│   │   ├── database.ts              # IDatabase 接口 + MockDatabase 实现
│   │   ├── migrations.ts            # 迁移框架
│   │   └── models/
│   │       ├── index.ts             # barrel
│   │       ├── Photo.ts             # photoToRecord / recordToPhoto
│   │       ├── Album.ts             # albumToRecord / recordToAlbum
│   │       └── FaceGroup.ts         # FaceGroup 序列化
│   ├── services/
│   │   ├── photoImport/             # ✅ 照片导入服务层（适配器模式）
│   │   │   ├── types.ts             # IPhotoPicker / IThumbnailGenerator / IExifParser / IColorExtractor
│   │   │   ├── ImagePickerAdapter.ts # react-native-image-picker 适配
│   │   │   ├── ThumbnailGenerator.ts # @bam.tech/react-native-image-resizer 适配
│   │   │   ├── ExifParserAdapter.ts  # EXIF 元数据解析（iOS/Android 原生格式）
│   │   │   ├── SkiaColorExtractor.ts # @shopify/react-native-skia 像素采样主色提取
│   │   │   ├── FallbackColorExtractor.ts # 主色提取 fallback
│   │   │   ├── PhotoImportService.ts # 编排层：选择 → 缩略图 → EXIF → 颜色 → Photo
│   │   │   ├── factory.ts           # 工厂函数，支持依赖覆盖
│   │   │   └── index.ts             # barrel
│   │   ├── faceCluster/             # ✅ 人脸聚类服务层
│   │   │   ├── FaceClusterService.ts # IFaceClusterService + 聚类/命名/合并/拆分
│   │   │   └── index.ts             # barrel
│   │   ├── haptics/                 # ✅ 触感反馈服务
│   │   │   └── index.ts             # triggerHaptic + 7 种触感类型
│   │   ├── backup/                  # ✅ 备份恢复服务
│   │   │   ├── types.ts             # IBackupService / BackupData / BackupMeta / BackupProgress
│   │   │   ├── JsonBackupService.ts # JSON 格式备份 + RNFS 文件写入 + 内存 fallback
│   │   │   └── index.ts             # barrel
│   │   ├── stories/                 # ✅ 故事生成服务
│   │   │   ├── types.ts             # IStoryGenerator / Story / StorySlide / StoryLayout
│   │   │   ├── StoryGenerator.ts    # 智能分组 + 转场选择 + 时长计算 + 标题生成
│   │   │   └── index.ts             # barrel
│   │   ├── tags/                    # ✅ 标签管理服务
│   │   │   ├── types.ts             # ITagService / TagInfo
│   │   │   ├── TagService.ts        # CRUD + 重命名/合并/删除 + 建议 + 热门
│   │   │   └── index.ts             # barrel
│   │   ├── mapClustering/           # ✅ 地图聚合服务
│   │   │   ├── types.ts             # IMapClusterService / Cluster / ClusterItem / GeoPoint
│   │   │   ├── GridClusterService.ts # 网格聚类算法 + 缩放自适应
│   │   │   └── index.ts             # barrel
│   │   ├── video/                   # ✅ 视频支持服务
│   │   │   ├── types.ts             # IVideoThumbnailService / IVideoMetadataService / VideoMetadata
│   │   │   ├── VideoThumbnailService.ts # 视频帧截取
│   │   │   ├── VideoMetadataService.ts  # 视频元数据读取
│   │   │   └── index.ts             # barrel
│   │   ├── print/                   # ✅ 打印服务
│   │   │   ├── types.ts             # IPrintService / PrintLayout / PrintOptions
│   │   │   ├── ReactNativePrintService.ts # react-native-print 适配
│   │   │   └── index.ts             # barrel
│   │   ├── filters/                 # ✅ 滤镜服务
│   │   │   └── index.ts             # 7 种 Skia ColorMatrix 滤镜
│   │   ├── biometrics/              # ✅ 生物识别服务
│   │   │   └── index.ts             # react-native-biometrics 适配
│   │   ├── notifications/           # ✅ 通知调度服务
│   │   │   └── index.ts             # react-native-push-notification 记忆推送
│   │   ├── memories/                # ✅ 记忆服务
│   │   │   └── index.ts             # 那年今天 + 季节回忆 + 地点回忆
│   │   ├── deepLinking/             # ✅ 深度链接
│   │   │   └── index.ts             # mimo:// 协议解析
│   │   ├── accessibility/           # ✅ 无障碍
│   │   │   └── index.ts             # 辅助属性工具
│   │   └── share/                   # ✅ 分享服务
│   │       └── index.ts             # react-native-share 适配
│   ├── navigation/
│   │   ├── index.ts                 # barrel
│   │   ├── types.ts                 # 导航参数工具类型
│   │   ├── RootNavigator.tsx        # Lock → Onboarding → Main(6 tabs) → 18 子页面
│   │   └── TabNavigator.tsx         # 6 标签底部导航
│   ├── screens/                     # 27 个屏幕
│   │   ├── GridScreen.tsx           # ✅ 网格 + 搜索 + 筛选 + 选择 + FAB + 4 覆盖层
│   │   ├── DiscoveryScreen.tsx      # ✅ 发现页（回忆/故事/标签/地点/分类/精选）
│   │   ├── LockScreen.tsx           # ✅ 4 位 PIN 键盘 + 生物识别 + 错误动画
│   │   ├── OnboardingScreen.tsx     # ✅ 3 页引导 + 页面指示器
│   │   ├── LightboxScreen.tsx       # ✅ FlatList 水平滑动 + PinchZoom + 打印
│   │   ├── TimelineScreen.tsx       # ✅ 按月分组 + sticky headers + 行布局
│   │   ├── MapScreen.tsx            # ✅ 地图聚合标记 + 缩略图 + 底部地点列表
│   │   ├── CategoryScreen.tsx       # ✅ 按 AI 分类聚合 + 每类内行布局
│   │   ├── TrashScreen.tsx          # ✅ 恢复/彻底删除/清空 + 30天倒计时
│   │   ├── EditPanelScreen.tsx      # ✅ 4 标签编辑器（调整/滤镜/裁剪/标注）+ 版本保存
│   │   ├── SettingsScreen.tsx       # ✅ 全页：主题/列数/PIN/生物/关于
│   │   ├── AlbumDetailScreen.tsx    # ✅ 相册内照片网格
│   │   ├── AlbumsScreen.tsx         # ✅ 相册列表 + 创建对话框
│   │   ├── PeopleScreen.tsx         # ✅ 人脸聚类概览 + 命名 + FaceClusterService
│   │   ├── FaceGroupDetailScreen.tsx # ✅ 人脸聚类详情 + 按 groupId 过滤
│   │   ├── HiddenScreen.tsx         # ✅ 隐藏照片网格 + 取消隐藏
│   │   ├── FavoritesScreen.tsx      # ✅ 收藏照片网格
│   │   ├── SlideshowScreen.tsx      # ✅ Ken Burns 动画幻灯片 + 播放/暂停
│   │   ├── CollageScreen.tsx        # ✅ 拼图制作（2-9 张，间距/圆角可调）
│   │   ├── VersionHistoryScreen.tsx # ✅ 编辑版本历史浏览/恢复/删除
│   │   ├── StorageDashboardScreen.tsx # ✅ 存储统计 + 分类占用 + 清理建议
│   │   ├── SearchResultsScreen.tsx  # ✅ 语义搜索结果页 + 评分排序
│   │   ├── StoryViewerScreen.tsx    # ✅ 全屏故事播放器 + 转场动画 + 进度条
│   │   ├── TagsScreen.tsx           # ✅ 标签管理 + 标签云 + 重命名/合并/删除
│   │   ├── VideoPlayerScreen.tsx    # ✅ 全屏视频播放器 + 进度条 + 控制栏
│   │   └── CompareScreen.tsx        # ✅ 滑动分屏对比
│   ├── components/
│   │   ├── photo/
│   │   │   ├── PhotoCard.tsx        # 标签/收藏/选中遮罩/memo + 视频标识
│   │   │   ├── PhotoGrid.tsx        # FlatList numColumns + 动态卡尺寸
│   │   │   ├── DateGroupHeader.tsx  # 月份分组头
│   │   │   └── VideoIndicator.tsx   # 视频播放标识（▶ + 时长）
│   │   ├── lightbox/
│   │   │   ├── LightboxImage.tsx    # 捏合缩放 + 双击 + 拖拽关闭 (reanimated)
│   │   │   ├── LightboxFooter.tsx   # 元数据 + 编辑/收藏/分享/打印/删除按钮
│   │   │   ├── ExifCard.tsx         # EXIF 信息网格（11 个字段）
│   │   │   └── EditPanel/
│   │   │       ├── AdjustTab.tsx    # 亮度/对比度/饱和度 (−/+ 按钮)
│   │   │       ├── FilterTab.tsx    # 8 种滤镜预设（暖色/冷色/黑白...）
│   │   │       ├── CropTab.tsx      # 5 种裁切比例 + 旋转按钮
│   │   │       └── DrawTab.tsx      # 8 色 + 4 笔刷大小 + 清除/保存
│   │   ├── search/
│   │   │   ├── SearchBar.tsx        # 搜索栏 + 取消按钮
│   │   │   ├── SearchSuggestions.tsx # 搜索历史 + 推荐查询
│   │   │   └── SemanticChips.tsx    # ✅ 查询解析芯片（时间/地点/内容/分类/季节）
│   │   ├── filter/
│   │   │   ├── FilterRow.tsx        # 分类 + 收藏筛选滚动条
│   │   │   └── FilterChip.tsx       # MD3 chip
│   │   ├── overlays/
│   │   │   ├── AiOverlay.tsx        # AI 管线进度条 + 开始/暂停
│   │   │   ├── DedupOverlay.tsx     # 去重扫描 + 相似度 + 标记
│   │   │   ├── ImportProgressModal.tsx # ✅ 真实导入进度（替代模拟定时器）
│   │   │   ├── StatsModal.tsx       # 照片统计 + 分类分布
│   │   │   ├── SettingsModal.tsx    # 主题/列数/PIN/生物/FAB 开关
│   │   │   ├── BackupModal.tsx      # 备份/恢复双标签页 + 进度条
│   │   │   ├── DataExportModal.tsx  # JSON/CSV 双格式导出 + 实时预览
│   │   │   ├── PrintModal.tsx       # 打印对话框（6 种布局 + 质量 + 份数）
│   │   │   ├── BatchEditModal.tsx   # 批量编辑（分类 + 标签）
│   │   │   ├── ShareSheet.tsx       # 分享 + 5 种导出选项
│   │   │   └── PhotoActionSheet.tsx # 照片操作面板
│   │   ├── albums/
│   │   │   ├── AlbumCreateDialog.tsx # 创建相册弹窗
│   │   │   ├── AlbumChipMenu.tsx    # 底部列表添加到相册（支持批量）
│   │   │   ├── AlbumDropZone.tsx    # 拖放照片到相册 drop targets
│   │   │   ├── PhotoPickerDialog.tsx # 多选照片弹窗
│   │   │   ├── AlbumSortBar.tsx     # 相册排序栏
│   │   │   └── SmartAlbumDialog.tsx  # 创建智能相册弹窗
│   │   ├── fab/
│   │   │   ├── FabButton.tsx        # FAB 项
│   │   │   └── FabMenu.tsx          # ✅ 相册导入/拍照导入/AI/拼图/幻灯片/去重/存储
│   │   ├── gestures/
│   │   │   ├── index.ts             # barrel
│   │   │   ├── SwipeablePhotoCard.tsx # 左右滑动（收藏/删除）
│   │   │   ├── PinchGridResize.ts   # 捏合缩放网格列数
│   │   │   ├── SwipeSelect.ts       # 滑动批量选择
│   │   │   ├── FlipLayout.ts        # 翻转布局
│   │   │   └── StaggeredEntrance.ts # 交错入场动画
│   │   └── shared/
│   │       ├── Toolbar.tsx          # 标题栏 + 返回按钮 + actions
│   │       ├── Toast.tsx            # Toast 队列 + 自动消失
│   │       ├── EmptyState.tsx       # 图标 + 标题 + 副标题空状态
│   │       ├── ContextMenu.tsx      # 长按弹出菜单
│   │       ├── PeekOverlay.tsx      # 模态预览卡片 + 快速操作
│   │       ├── MemoryCard.tsx       # "那年今天" 卡片
│   │       ├── NotificationBadge.tsx # 通知徽章
│   │       └── PullToRefresh.tsx    # 下拉刷新
│   ├── theme/
│   │   └── index.tsx                # 5 套配色 + ThemeProvider + useAppTheme
│   ├── hooks/
│   │   ├── index.ts                 # barrel
│   │   ├── useAppInit.ts            # 启动初始化（设置 + mock 数据）
│   │   ├── usePhotos.ts             # 筛选/排序/分组（month/location）
│   │   ├── useSemanticSearch.ts     # ✅ SearchIndex + 评分排序 + 智能建议
│   │   ├── useMemoryPhotos.ts       # "那年今天"
│   │   ├── usePhotoImport.ts        # ✅ 照片导入 hook（相册/相机/进度/取消）
│   │   ├── useHaptics.ts            # ✅ 触感反馈 hook
│   │   └── useShare.ts              # ✅ 分享 hook
│   ├── ai/
│   │   ├── index.ts                 # barrel
│   │   ├── pipeline.ts              # ✅ IAiProcessor 插件式管线 + 自动更新 photoStore
│   │   ├── mockProcessors.ts        # ✅ MockLabelProcessor / MockFaceProcessor / MockEmbeddingProcessor
│   │   ├── dedup.ts                 # ✅ pHash DCT 实现 + 汉明距离 + 快速排除 + 相似对查找
│   │   ├── searchIndex.ts           # ✅ 倒排索引（O(k) 词条查找 + OR/AND 搜索）
│   │   ├── nlu/parser.ts            # ✅ 增强中文意图解析（时间/地点/内容/分类/季节 + 智能建议）
│   │   ├── embedding/index.ts       # TFLite 嵌入接口 + 余弦相似度
│   │   └── processors/
│   │       ├── index.ts             # barrel
│   │       ├── MlKitLabelProcessor.ts # ML Kit 图像标签
│   │       ├── MlKitFaceProcessor.ts  # ML Kit 人脸检测
│   │       └── TfliteEmbeddingProcessor.ts # TFLite 嵌入
│   ├── utils/
│   │   ├── index.ts                 # barrel
│   │   ├── image.ts                 # ✅ ThumbnailGenerator + ColorExtractor + set* 替换接口
│   │   ├── exif.ts                  # ✅ ExifParserAdapter + setExifParser 替换接口
│   │   ├── date.ts                  # 日期格式化（相对/绝对）
│   │   ├── collages.ts              # 拼图布局算法 + Skia 渲染命令
│   │   ├── mockData.ts              # 24 张模拟照片生成器
│   │   ├── constants.ts             # 常量 + 主题名 + 分类标签 + emoji
│   │   ├── logger.ts                # __DEV__ 模式日志
│   │   └── accessibility.ts         # 无障碍工具函数
│   └── gestures/
│       └── index.ts                 # 手势 barrel
```

## 数据模型（核心）

```typescript
interface Photo {
  id: string; uri: string; thumbnailUri?: string;
  filename: string; sizeBytes: number; width: number; height: number;
  createdAt: number; dateTaken: string; timeTaken: string;
  latitude: number | null; longitude: number | null; locationName: string | null;
  exif: ExifData; color: string;
  isFavorite: boolean; isHidden: boolean; isPinned: boolean; isDeleted: boolean;
  aiTags: string[] | null; aiCategory: Category | null; faceCount: number | null;
  phash: string | null; embedding: number[] | null; duplicateOfId: string | null;
  edits: EditState; versions: EditVersion[]; rating: number;
  mediaType: 'photo' | 'video'; duration: number | null;
}
```

## 导航结构

```
RootStack (NativeStackNavigator)
├── Lock          → LockScreen ✅
├── Onboarding    → OnboardingScreen ✅
├── Main          → TabNavigator (BottomTabs)
│   ├── GridTab       → GridScreen ✅ (含 4 个覆盖层)
│   ├── DiscoveryTab  → DiscoveryScreen ✅ (回忆/故事/标签/地点/分类/精选)
│   ├── TimelineTab   → TimelineScreen ✅
│   ├── MapTab        → MapScreen ✅ (聚合标记)
│   ├── CategoryTab   → CategoryScreen ✅
│   └── TrashTab      → TrashScreen ✅
├── Lightbox      → LightboxScreen ✅ (捏合缩放 + 打印)
├── EditPanel     → EditPanelScreen ✅ (调整/滤镜/裁剪/标注)
├── Settings      → SettingsScreen ✅
├── AlbumDetail   → AlbumDetailScreen ✅
├── Albums        → AlbumsScreen ✅
├── People        → PeopleScreen ✅ (FaceClusterService + 命名)
├── FaceGroupDetail → FaceGroupDetailScreen ✅
├── Hidden        → HiddenScreen ✅
├── Favorites     → FavoritesScreen ✅
├── Slideshow     → SlideshowScreen ✅ (Ken Burns)
├── Collage       → CollageScreen ✅
├── VersionHistory → VersionHistoryScreen ✅
├── StorageDashboard → StorageDashboardScreen ✅
├── SearchResults → SearchResultsScreen ✅
├── Compare       → CompareScreen ✅
├── StoryViewer   → StoryViewerScreen ✅ (转场动画 + 进度条)
├── Tags          → TagsScreen ✅ (标签云 + 管理)
└── VideoPlayer   → VideoPlayerScreen ✅ (全屏播放器)
```

## Store 接口速查

| Store | 关键 state | 关键 actions |
|-------|-----------|-------------|
| `photoStore` | photos[], filter, sortMode, selectedIds, isGridReady | setPhotos, addPhotos, updatePhoto, batchFavorite/Delete/Hide, getFilteredPhotos() |
| `albumStore` | albums[] | createAlbum, createSmartAlbum, addToAlbum, removeFromAlbum |
| `uiStore` | toasts[], isFabOpen, gridColumns, modals, storyCache | showToast, toggleFab, set*Visible(), cacheStory, getStory |
| `settingsStore` | theme, gridColumns, pinEnabled, pinCode, lastImportTimestamp | setTheme, setGridColumns, setPin, load/persist |
| `aiStore` | status (isRunning, queueSize, ...), results Map | startPipeline, reportResult, reportError |

## 后期修改接口速查

| 修改需求 | 目标文件 | 方法 |
|---------|---------|------|
| 新增主题配色 | `theme/index.tsx` → `SCHEME_SOURCES` | 加一行 { light, dark } 色源 |
| 新增照片属性 | `types/index.ts` → `Photo` | 加字段 |
| 替换数据库 | `db/database.ts` | `setDatabase(new RealDB())` — 接口不变 |
| 接入真实 AI | `ai/pipeline.ts` | 注册 IAiProcessor |
| 替换图片选择器 | `services/photoImport/` | 实现 IPhotoPicker，传入 factory |
| 替换缩略图生成 | `utils/image.ts` | `setThumbnailGenerator(gen)` |
| 替换 EXIF 解析 | `utils/exif.ts` | `setExifParser(parser)` |
| 替换主色提取 | `utils/image.ts` | `setColorExtractor(ext)` |
| 替换人脸聚类 | `services/faceCluster/` | 实现 IFaceClusterService |
| 替换备份服务 | `services/backup/` | 实现 IBackupService |
| 替换故事生成 | `services/stories/` | 实现 IStoryGenerator |
| 替换标签服务 | `services/tags/` | 实现 ITagService |
| 替换地图聚合 | `services/mapClustering/` | 实现 IMapClusterService |
| 替换视频缩略图 | `services/video/` | 实现 IVideoThumbnailService |
| 替换打印服务 | `services/print/` | 实现 IPrintService |
| 新增标签页 | `navigation/TabNavigator.tsx` | 加 Tab.Screen |
| 新增路由 | `types/index.ts` → RootNavigator | 加 ParamList + Screen |
| 替换持久化 | `store/settingsStore.ts` | 改 loadSettings/persistSettings 内部 |
| 新增筛选维度 | `store/photoStore.ts` | PhotoFilter + getFilteredPhotos() |
| 新增分类 emoji | `utils/constants.ts` → `CATEGORY_EMOJI` | 加一行 |
| 扩展 NLU 模式 | `ai/nlu/parser.ts` | 添加 PatternRule 到对应数组 |

## AI 对标

| Web 模拟 | React Native 真实实现 |
|---------|---------------------|
| MobileNet 分类 | ML Kit Image Labeling（400+ 类别） |
| face-api.js | ML Kit Face Detection（特征点 + 描述符） |
| CLIP 嵌入 | TFLite MobileCLIP → 语义搜索 |
| pHash DCT 实现 ✅ | TS 原生 8x8 DCT + 汉明距离 + 快速排除 |
| 中文 NLU ✅ | 增强正则 + 关键词 + 季节映射 + 分类映射 + 智能建议 |
| MockProcessor ✅ | MockLabel / MockFace / MockEmbedding 模拟 AI 分析 |

## 开发阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 0 | 框架搭建 + TS 类型 + 接口设计 | ✅ 完成 |
| Phase 1 | 导航 + 5 Store + 主题 + 20 屏幕 + 28 组件 + 4 hooks | ✅ 完成 |
| Phase 2 | 真实照片（相机/相册/EXIF/缩略图/导入管线） | ✅ 完成 |
| Phase 3 | 搜索增强 + 人脸聚类 + 去重引擎 + AI Pipeline | ✅ 完成 |
| Phase 4 | 本地 AI（ML Kit + TFLite） | ✅ 完成（ML Kit + Skia + WatermelonDB） |
| Phase 5 | 打磨（动画/性能/触感/手势） | ✅ 完成 |
| Phase 6 | 拓展（备份/故事/标签/聚合/视频/打印/发现） | ✅ 完成 |

### Phase 2-3 完成明细

| 功能 | 文件 | 说明 |
|------|------|------|
| 照片导入服务层 | `services/photoImport/` | 适配器模式：IPhotoPicker / IThumbnailGenerator / IExifParser / IColorExtractor |
| 真实图片选择 | `ImagePickerAdapter.ts` | react-native-image-picker 适配（相册 + 相机） |
| 缩略图生成 | `ThumbnailGenerator.ts` | @bam.tech/react-native-image-resizer 适配 |
| EXIF 解析 | `ExifParserAdapter.ts` | 支持 iOS/Android 原生 EXIF 格式（Make/Model/FNumber/ISO/GPS 等） |
| 导入 Hook | `hooks/usePhotoImport.ts` | React 层封装：相册/相机 + 进度 + 取消 |
| 导入进度 | `ImportProgressModal.tsx` | 真实进度替代模拟定时器 |
| FAB 菜单 | `FabMenu.tsx` | 相册导入 + 拍照导入 + AI + 拼图 + 幻灯片 + 去重 + 存储 |
| 搜索增强 | `useSemanticSearch.ts` | SearchIndex 集成 + 评分排序 + 智能建议 |
| NLU 增强 | `nlu/parser.ts` | 8 种时间模式 + 季节映射 + 7 分类关键词 + 智能建议 |
| 人脸聚类 | `services/faceCluster/` | FaceClusterService + 聚类/命名/合并/拆分 |
| PeopleScreen | `PeopleScreen.tsx` | FaceClusterService + 长按命名 |
| FaceGroupDetail | `FaceGroupDetailScreen.tsx` | 按 groupId 过滤 + 人脸缩略图 |
| pHash 去重 | `ai/dedup.ts` | 8x8 DCT + 双线性缩放 + 汉明距离 + 快速排除 + 相似对查找 |
| AI Pipeline | `ai/pipeline.ts` | 自动更新 photoStore（aiTags/aiCategory/faceCount/embedding） |
| Mock AI | `ai/mockProcessors.ts` | MockLabelProcessor / MockFaceProcessor / MockEmbeddingProcessor |
| utils 增强 | `utils/image.ts` + `utils/exif.ts` | setThumbnailGenerator / setColorExtractor / setExifParser 替换接口 |

### Phase 4-5 完成明细

| 功能 | 文件 | 说明 |
|------|------|------|
| AI Pipeline 接入 | `AiOverlay.tsx` | 注册 MockLabel/MockFace/MockEmbedding + 启动/暂停 + 完成通知 |
| 触感反馈 | `services/haptics/index.ts` | react-native-haptic-feedback 7 种触感类型 |
| 触感 Hook | `hooks/useHaptics.ts` | 真实触感替代 no-op，接口不变 |
| 滑动对比 | `CompareScreen.tsx` | Reanimated + GestureDetector 滑动分屏对比 |
| 入场动画 | `PhotoCard.tsx` | Reanimated stagger fade-in + scale（30ms 间隔，最大 600ms） |
| 滑动选择 | `SwipeSelect.ts` | 命中测试 + registerLayout + Pan 手势批量选中 |
| 搜索结果 | `SearchResultsScreen.tsx` | useSemanticSearch + SemanticChips + 评分排序 |

### Phase 4 完成明细（ML Kit + Skia + WatermelonDB）

| 功能 | 文件 | 说明 |
|------|------|------|
| ML Kit 标签 | `ai/processors/MlKitLabelProcessor.ts` | @react-native-ml-kit/image-labeling 适配，400+ 类别，自动分类映射 |
| ML Kit 人脸 | `ai/processors/MlKitFaceProcessor.ts` | @react-native-ml-kit/face-detection 适配，人脸计数 + 快速模式 |
| TFLite 嵌入 | `ai/processors/TfliteEmbeddingProcessor.ts` | TFLite 嵌入接口 + MockEmbedding fallback |
| Skia 主色 | `services/photoImport/SkiaColorExtractor.ts` | @shopify/react-native-skia 像素采样 → 平均色提取 |
| WatermelonDB | `db/WatermelonDatabase.ts` | SQLite 持久化：Photo/Album/KV CRUD + 关联表 + 智能相册规则 |
| 自动切换 | `AiOverlay.tsx` + `factory.ts` + `database.ts` | require() 检测 → 有真实库用真实，无则 fallback Mock |

### 生产级增强明细

| 功能 | 文件 | 说明 |
|------|------|------|
| 真实地图 | `MapScreen.tsx` | react-native-maps MapView + Marker + Callout + 底部横向地点列表 |
| 设置持久化 | `settingsStore.ts` | react-native-mmkv 替代内存存储，loadSettings/persistSettings 真实读写 |
| 滤镜矩阵 | `services/filters/index.ts` | 7 种 Skia ColorMatrix 滤镜（暖色/冷色/黑白/鲜艳/褪色/复古/戏剧） |
| 数据库持久化 | `photoStore.ts` | addPhotos/updatePhoto/batch* 自动写入 WatermelonDB，hydrateFromDb 启动水合 |
| 分享功能 | `services/share/index.ts` | react-native-share 单张/多张分享 |
| 错误边界 | `ErrorBoundary.tsx` | 全局 React 错误捕获 + 重试 |
| 分享 Hook | `hooks/useShare.ts` | react-native-share 封装 |
| 相册持久化 | `albumStore.ts` | WatermelonDB 自动写入 + hydrateFromDb |
| 记忆服务 | `services/memories/index.ts` | 那年今天 + 季节回忆 + 地点回忆 |
| 深度链接 | `services/deepLinking/index.ts` | mimo:// 协议解析 + 导航路由映射 |
| 无障碍 | `services/accessibility/index.ts` | PhotoCard/Button/Header/List/Tab 辅助属性 |

### 代码审计修复明细

| 修复 | 文件 | 说明 |
|------|------|------|
| Tab 图标 | `TabNavigator.tsx` | 6 个标签全部显示 Unicode 图标 + 主题色 |
| 空回调 | `HiddenScreen/TrashScreen/DedupOverlay/SearchResultsScreen` | 连接真实导航/操作 |
| 空 catch | `photoStore.ts` + `albumStore.ts` | 统一 logError 日志（14 处） |
| 错误日志 | `utils/logger.ts` | __DEV__ 模式 console.warn |
| 手势 barrel | `gestures/index.ts` | 导出 SwipeablePhotoCard + useSwipeSelect + usePinchGridResize |
| ShareSheet | `ShareSheet.tsx` | 接入 react-native-share + 5 种导出选项 |
| 记忆连接 | `useMemoryPhotos.ts` + `MemoryCard.tsx` | 接入 memories 服务，支持 4 种回忆类型 |
| GridScreen | `GridScreen.tsx` | MemoryGroup 属性适配 |

### 最终打磨明细

| 功能 | 文件 | 说明 |
|------|------|------|
| Skia 拼图 | `utils/collages.ts` | computeCellFrames + computeSkiaDrawCommands 布局引擎 |
| 生物识别 | `services/biometrics/index.ts` | react-native-biometrics 适配（FaceID/TouchID/指纹） |
| LockScreen | `LockScreen.tsx` | 自动检测生物识别 + 一键解锁按钮 |
| ContextMenu | `ContextMenu.tsx` | 真实模态菜单（图标 + 破坏性操作 + 禁用状态） |
| 通知调度 | `services/notifications/index.ts` | react-native-push-notification 记忆推送 + 8 小时延迟 |
| 数据导出 | `DataExportModal.tsx` | JSON/CSV 双格式导出 + 实时预览 |
| 类型清理 | `types/index.ts` | 移除 MemoryPhoto，导出 MemoryGroup/BackupMeta |
| 类型声明 | `types/react-native-push-notification.d.ts` | 第三方库类型补丁 + TextEncoder |

### Phase 6 拓展明细

| 功能 | 文件 | 说明 |
|------|------|------|
| 备份恢复 | `services/backup/` | IBackupService + JsonBackupService（RNFS 文件写入 + 内存 fallback） |
| 备份 UI | `BackupModal.tsx` | 备份/恢复双标签页 + 进度条 + 备份列表 |
| 故事生成 | `services/stories/` | IStoryGenerator + 智能分组/转场/时长/标题自动生成 |
| 故事播放 | `StoryViewerScreen.tsx` | 全屏播放器 + fade/slide/zoom 转场 + 进度条 + 播放/暂停 |
| 故事缓存 | `uiStore.ts` | storyCache Map + cacheStory/getStory |
| 标签管理 | `services/tags/` | ITagService + CRUD + 重命名/合并/删除 + 建议 + 热门 |
| 标签页面 | `TagsScreen.tsx` | 标签云 + 搜索 + 长按菜单（重命名/合并/删除） |
| 地图聚合 | `services/mapClustering/` | IMapClusterService + 网格聚类算法 + 缩放自适应 |
| 地图聚合 UI | `MapScreen.tsx` | 聚合 Marker（圆形+数字）+ 点击放大 + 单个 Marker 导航 |
| 视频支持 | `services/video/` | IVideoThumbnailService + IVideoMetadataService |
| 视频标识 | `VideoIndicator.tsx` | ▶ + mm:ss 时长叠加在缩略图右下角 |
| 视频播放 | `VideoPlayerScreen.tsx` | 全屏播放器 + 进度条 + 播放/暂停 + 控制栏 |
| 视频数据 | `types/index.ts` | Photo 新增 mediaType/duration 字段 |
| 打印服务 | `services/print/` | IPrintService + ReactNativePrintService（6 种布局 + 质量 + 份数） |
| 打印 UI | `PrintModal.tsx` | 布局选择 + 质量选择 + 份数调整 + 标题开关 |
| 打印入口 | `LightboxFooter.tsx` + `LightboxScreen.tsx` | 🖨️ 打印按钮 + PrintModal |
| 发现页面 | `DiscoveryScreen.tsx` | 回忆/故事/标签/地点/分类/精选 6 区块 |
| 发现标签 | `TabNavigator.tsx` | 新增 DiscoveryTab（🔍 发现） |

## 运行

```bash
cd MiMoApp
npm install
npx react-native run-android  # 需要 Android SDK
```

## 设计原则

- **接口隔离**：每个模块通过明确的 TS 接口暴露，实现可整体替换
- **单一职责**：Store 切片独立；组件纯展示 vs 容器分离
- **依赖倒置**：IDatabase → MockDB/MelonDB；IAiProcessor → ML Kit/TFLite；IPhotoPicker → ImagePicker
- **最少影响**：修改通常只影响单个文件，跨模块通过 barrel index
- **工厂模式**：createPhotoImportService(overrides?) 支持依赖注入
- **适配器模式**：所有第三方库通过接口适配，不可用时自动 fallback
