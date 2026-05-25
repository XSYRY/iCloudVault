package com.mimoapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * ReactPackage — 注册视频相关原生模块
 *
 * 包含：
 * - VideoThumbnailModule：视频帧提取 + 元数据获取
 * - MotionPhotoModule：动态照片检测 + 视频提取
 */
class VideoPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> {
        return listOf(
            VideoThumbnailModule(reactContext),
            MotionPhotoModule(reactContext),
        )
    }

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> {
        return emptyList()
    }
}
