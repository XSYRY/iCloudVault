package com.mimoapp

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

/**
 * 视频缩略图 & 元数据原生模块
 *
 * 使用 MediaMetadataRetriever 提取视频帧和元数据，
 * 替代 react-native-video v4 已废弃的 Video.capture() / Video.getMetadata()。
 */
class VideoThumbnailModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "VideoThumbnailModule"

    /**
     * 提取视频指定时间点的帧，保存为 JPEG 临时文件，返回 file:// URI。
     *
     * @param videoUri  视频路径（file:// 或 content://）
     * @param timeMs    目标时间点（毫秒），默认 1000
     * @param quality   JPEG 压缩质量 0-100，默认 80
     */
    @ReactMethod
    fun generateThumbnail(videoUri: String, timeMs: Double, quality: Int, promise: Promise) {
        Thread {
            var retriever: MediaMetadataRetriever? = null
            try {
                retriever = MediaMetadataRetriever()
                setDataSource(retriever, videoUri)

                // MediaMetadataRetriever 使用微秒
                val timeUs = (timeMs * 1000).toLong()
                val bitmap = retriever.getFrameAtTime(
                    timeUs,
                    MediaMetadataRetriever.OPTION_CLOSEST_SYNC
                ) ?: throw Exception("无法提取视频帧：timeMs=$timeMs")

                // 保存到缓存目录
                val cacheDir = File(reactApplicationContext.cacheDir, "video_thumbnails")
                if (!cacheDir.exists()) cacheDir.mkdirs()

                val fileName = "thumb_${UUID.randomUUID()}.jpg"
                val outFile = File(cacheDir, fileName)

                FileOutputStream(outFile).use { fos ->
                    bitmap.compress(
                        Bitmap.CompressFormat.JPEG,
                        quality.coerceIn(1, 100),
                        fos
                    )
                }
                bitmap.recycle()

                promise.resolve("file://${outFile.absolutePath}")
            } catch (e: Exception) {
                promise.reject("THUMBNAIL_ERROR", e.message, e)
            } finally {
                try {
                    retriever?.release()
                } catch (_: Exception) {}
            }
        }.start()
    }

    /**
     * 获取视频元数据：duration、width、height、bitrate、codec、framerate。
     *
     * @param videoUri 视频路径（file:// 或 content://）
     */
    @ReactMethod
    fun getMetadata(videoUri: String, promise: Promise) {
        Thread {
            var retriever: MediaMetadataRetriever? = null
            try {
                retriever = MediaMetadataRetriever()
                setDataSource(retriever, videoUri)

                val durationStr = retriever.extractMetadata(
                    MediaMetadataRetriever.METADATA_KEY_DURATION
                )
                val widthStr = retriever.extractMetadata(
                    MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH
                )
                val heightStr = retriever.extractMetadata(
                    MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT
                )
                val bitrateStr = retriever.extractMetadata(
                    MediaMetadataRetriever.METADATA_KEY_BITRATE
                )
                val mimeType = retriever.extractMetadata(
                    MediaMetadataRetriever.METADATA_KEY_MIMETYPE
                )
                // METADATA_KEY_CAPTURE_FRAMERATE 需要 API 23+
                val framerateStr = try {
                    retriever.extractMetadata(
                        MediaMetadataRetriever.METADATA_KEY_CAPTURE_FRAMERATE
                    )
                } catch (_: Exception) { null }

                val result = Arguments.createMap().apply {
                    putDouble("duration", (durationStr?.toLongOrNull() ?: 0L).toDouble())
                    putInt("width", widthStr?.toIntOrNull() ?: 0)
                    putInt("height", heightStr?.toIntOrNull() ?: 0)
                    if (bitrateStr != null) {
                        putInt("bitrate", bitrateStr.toIntOrNull() ?: 0)
                    }
                    if (mimeType != null) {
                        putString("codec", mimeType)
                    }
                    if (framerateStr != null) {
                        putDouble("framerate", framerateStr.toDoubleOrNull() ?: 0.0)
                    }
                }

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("METADATA_ERROR", e.message, e)
            } finally {
                try {
                    retriever?.release()
                } catch (_: Exception) {}
            }
        }.start()
    }

    /**
     * 清理缓存的缩略图文件。
     */
    @ReactMethod
    fun clearThumbnailCache(promise: Promise) {
        Thread {
            try {
                val cacheDir = File(reactApplicationContext.cacheDir, "video_thumbnails")
                if (cacheDir.exists()) {
                    val count = cacheDir.listFiles()?.size ?: 0
                    cacheDir.deleteRecursively()
                    promise.resolve(count)
                } else {
                    promise.resolve(0)
                }
            } catch (e: Exception) {
                promise.reject("CACHE_CLEAR_ERROR", e.message, e)
            }
        }.start()
    }

    /**
     * 根据 URI 格式设置 MediaMetadataRetriever 的数据源。
     * 支持 file:// 路径和 content:// URI。
     */
    private fun setDataSource(retriever: MediaMetadataRetriever, uriString: String) {
        val cleanUri = uriString.trim()
        when {
            cleanUri.startsWith("content://") -> {
                retriever.setDataSource(reactApplicationContext, Uri.parse(cleanUri))
            }
            cleanUri.startsWith("file://") -> {
                retriever.setDataSource(cleanUri.removePrefix("file://"))
            }
            cleanUri.startsWith("/") -> {
                retriever.setDataSource(cleanUri)
            }
            else -> {
                // 尝试作为 URI 解析
                retriever.setDataSource(reactApplicationContext, Uri.parse(cleanUri))
            }
        }
    }
}
