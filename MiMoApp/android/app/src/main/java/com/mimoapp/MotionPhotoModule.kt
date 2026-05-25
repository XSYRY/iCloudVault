package com.mimoapp

import android.net.Uri
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.util.UUID

/**
 * 动态照片（Motion Photo / Live Photo）检测原生模块
 *
 * 支持三种主流 Android 动态照片格式：
 * 1. Google Camera — JPEG 末尾直接附加 MP4，通过 `ftyp` box 标记定位
 * 2. Samsung — XMP 元数据中包含 <MotionPhoto> 标签，视频嵌入 JPEG 内
 * 3. Xiaomi — 类似 Google 格式，JPEG 后附加 MP4
 */
class MotionPhotoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MotionPhotoModule"

    /**
     * 检测文件是否为动态照片，返回检测结果。
     *
     * @param uri 图片文件路径（file:// 或 content:// 或绝对路径）
     * @return { isMotionPhoto, videoOffset?, videoLength?, format? }
     */
    @ReactMethod
    fun detect(uri: String, promise: Promise) {
        Thread {
            try {
                val bytes = readFileBytes(uri)
                if (bytes == null || bytes.size < 12) {
                    promise.resolve(createNegativeResult())
                    return@Thread
                }

                // 验证 JPEG 头（SOI marker: FF D8）
                if (bytes[0] != 0xFF.toByte() || bytes[1] != 0xD8.toByte()) {
                    promise.resolve(createNegativeResult())
                    return@Thread
                }

                // 策略 1：搜索 XMP MotionPhoto 标签（Samsung 格式）
                val xmpResult = detectXmpMotionPhoto(bytes)
                if (xmpResult != null) {
                    promise.resolve(xmpResult)
                    return@Thread
                }

                // 策略 2：从末尾向前搜索 ftyp MP4 box 标记（Google/Xiaomi 格式）
                val ftypResult = detectFtypMotionPhoto(bytes)
                if (ftypResult != null) {
                    promise.resolve(ftypResult)
                    return@Thread
                }

                promise.resolve(createNegativeResult())
            } catch (e: Exception) {
                promise.reject("MOTION_PHOTO_ERROR", e.message, e)
            }
        }.start()
    }

    /**
     * 从动态照片中提取视频部分，保存到缓存目录，返回文件 URI。
     *
     * @param uri         原始动态照片路径
     * @param videoOffset 视频数据在文件中的字节偏移量
     * @param videoLength 视频数据长度（0 表示从 offset 到文件末尾）
     */
    @ReactMethod
    fun extractVideo(uri: String, videoOffset: Double, videoLength: Double, promise: Promise) {
        Thread {
            try {
                val bytes = readFileBytes(uri)
                if (bytes == null) {
                    promise.reject("EXTRACT_ERROR", "无法读取文件")
                    return@Thread
                }

                val offset = videoOffset.toInt()
                val length = if (videoLength > 0) videoLength.toInt() else bytes.size - offset

                if (offset < 0 || offset >= bytes.size || offset + length > bytes.size) {
                    promise.reject("EXTRACT_ERROR", "偏移量或长度无效: offset=$offset, length=$length, fileSize=${bytes.size}")
                    return@Thread
                }

                val cacheDir = File(reactApplicationContext.cacheDir, "motion_photo_videos")
                if (!cacheDir.exists()) cacheDir.mkdirs()

                val outFile = File(cacheDir, "motion_${UUID.randomUUID()}.mp4")
                FileOutputStream(outFile).use { fos ->
                    fos.write(bytes, offset, length)
                }

                promise.resolve("file://${outFile.absolutePath}")
            } catch (e: Exception) {
                promise.reject("EXTRACT_ERROR", e.message, e)
            }
        }.start()
    }

    // ──────────────────────────────────────────────
    //  XMP MotionPhoto 检测（Samsung 格式）
    // ──────────────────────────────────────────────

    /**
     * 在 JPEG 的 APP1 段中搜索 XMP 命名空间的 MotionPhoto 标记。
     *
     * Samsung Motion Photo XMP 结构：
     *   <Container:Directory>
     *     <rdf:Seq>
     *       <rdf:li Item:Semantic="Primary" Item:Length="xxxxx"/>
     *       <rdf:li Item:Semantic="MotionPhoto" Item:Length="xxxxx"/>
     *     </rdf:Seq>
     *   </Container:Directory>
     *
     * 也可能包含 GCamera:MotionPhoto="1" 属性。
     */
    private fun detectXmpMotionPhoto(bytes: ByteArray): WritableMap? {
        // 将前 256KB 转为字符串搜索 XMP 标签（XMP 通常在文件头部）
        val searchLimit = minOf(bytes.size, 256 * 1024)
        val headerStr = String(bytes, 0, searchLimit, Charsets.ISO_8859_1)

        // 检查 GCamera:MotionPhoto 或 Camera:MotionPhoto
        val hasMotionPhotoTag =
            headerStr.contains("GCamera:MotionPhoto=\"1\"") ||
            headerStr.contains("Camera:MotionPhoto=\"1\"") ||
            headerStr.contains("MotionPhoto=\"1\"")

        if (!hasMotionPhotoTag) return null

        // 尝试从 XMP 中提取视频偏移量
        // 方法 1：Item:Length 属性
        val videoLength = extractXmpItemLength(headerStr, "MotionPhoto")

        if (videoLength != null && videoLength > 0) {
            val videoOffset = bytes.size - videoLength
            if (videoOffset > 0) {
                return Arguments.createMap().apply {
                    putBoolean("isMotionPhoto", true)
                    putInt("videoOffset", videoOffset)
                    putInt("videoLength", videoLength)
                    putString("format", "samsung_xmp")
                }
            }
        }

        // 方法 2：GCamera:MicroVideoOffset（Google 格式也可能有 XMP）
        val microVideoOffset = extractXmpValue(headerStr, "GCamera:MicroVideoOffset")
        if (microVideoOffset != null && microVideoOffset > 0) {
            val videoOffset = bytes.size - microVideoOffset
            return Arguments.createMap().apply {
                putBoolean("isMotionPhoto", true)
                putInt("videoOffset", videoOffset)
                putInt("videoLength", microVideoOffset)
                putString("format", "google_xmp")
            }
        }

        // 有 MotionPhoto 标记但无法确定偏移量，尝试 ftyp 查找
        val ftypOffset = findFtypFromEnd(bytes)
        if (ftypOffset > 0) {
            return Arguments.createMap().apply {
                putBoolean("isMotionPhoto", true)
                putInt("videoOffset", ftypOffset)
                putInt("videoLength", bytes.size - ftypOffset)
                putString("format", "samsung_ftyp_fallback")
            }
        }

        // 标记存在但无法提取
        return Arguments.createMap().apply {
            putBoolean("isMotionPhoto", true)
            putInt("videoOffset", 0)
            putInt("videoLength", 0)
            putString("format", "samsung_unknown")
        }
    }

    // ──────────────────────────────────────────────
    //  ftyp MP4 Box 检测（Google/Xiaomi 格式）
    // ──────────────────────────────────────────────

    /**
     * 从文件末尾向前搜索 MP4 的 ftyp box。
     *
     * MP4 文件以 ftyp box 开头，结构：
     *   [4 bytes: box size][4 bytes: "ftyp"][...payload...]
     *
     * 动态照片格式是 JPEG + MP4 拼接，所以 ftyp 标记出现在 JPEG 数据之后。
     * 从 ftyp box 的起始位置（box size 的第一个字节）开始就是视频数据。
     */
    private fun detectFtypMotionPhoto(bytes: ByteArray): WritableMap? {
        val ftypOffset = findFtypFromEnd(bytes)
        if (ftypOffset <= 0) return null

        // ftyp box 前 4 字节是 box size，video 从 box size 开始
        val videoStartOffset = ftypOffset - 4
        if (videoStartOffset <= 0) return null

        // 验证 box size 是否合理
        val boxSize = readBigEndianInt(bytes, videoStartOffset)
        if (boxSize < 8 || boxSize > bytes.size - videoStartOffset) {
            // box size 不合理，直接从 ftyp 偏移量 -4 开始
            return Arguments.createMap().apply {
                putBoolean("isMotionPhoto", true)
                putInt("videoOffset", videoStartOffset)
                putInt("videoLength", bytes.size - videoStartOffset)
                putString("format", "google_ftyp")
            }
        }

        return Arguments.createMap().apply {
            putBoolean("isMotionPhoto", true)
            putInt("videoOffset", videoStartOffset)
            putInt("videoLength", bytes.size - videoStartOffset)
            putString("format", "google_ftyp")
        }
    }

    // ──────────────────────────────────────────────
    //  工具方法
    // ──────────────────────────────────────────────

    /**
     * 从文件末尾向前搜索 "ftyp" 标记。
     * 返回 "ftyp" 第一个字母 'f' 的字节偏移量，未找到返回 -1。
     */
    private fun findFtypFromEnd(bytes: ByteArray): Int {
        // ftyp 是 ASCII: 0x66 0x74 0x79 0x70
        val marker = byteArrayOf(0x66, 0x74, 0x79, 0x70)
        // 从末尾向前搜索，最多搜索 10MB（动态照片视频通常不超过 3-5 秒）
        val searchStart = maxOf(0, bytes.size - 10 * 1024 * 1024)

        for (i in bytes.size - 4 downTo searchStart) {
            if (bytes[i] == marker[0] &&
                bytes[i + 1] == marker[1] &&
                bytes[i + 2] == marker[2] &&
                bytes[i + 3] == marker[3]
            ) {
                return i
            }
        }
        return -1
    }

    /**
     * 从 XMP 字符串中提取指定 Item:Semantic 的 Item:Length 值。
     */
    private fun extractXmpItemLength(xmpStr: String, semantic: String): Int? {
        // 搜索模式：Item:Semantic="MotionPhoto" Item:Length="12345"
        val pattern = Regex(
            """Item:Semantic\s*=\s*"$semantic"\s+Item:Length\s*=\s*"(\d+)"""",
            RegexOption.IGNORE_CASE
        )
        val match = pattern.find(xmpStr)
        return match?.groupValues?.get(1)?.toIntOrNull()
    }

    /**
     * 从 XMP 字符串中提取指定属性的整数值。
     */
    private fun extractXmpValue(xmpStr: String, attrName: String): Int? {
        val pattern = Regex("""$attrName\s*=\s*"(\d+)"""")
        val match = pattern.find(xmpStr)
        return match?.groupValues?.get(1)?.toIntOrNull()
    }

    /**
     * 读取 4 字节大端序整数。
     */
    private fun readBigEndianInt(bytes: ByteArray, offset: Int): Int {
        if (offset + 4 > bytes.size) return 0
        return ((bytes[offset].toInt() and 0xFF) shl 24) or
               ((bytes[offset + 1].toInt() and 0xFF) shl 16) or
               ((bytes[offset + 2].toInt() and 0xFF) shl 8) or
               (bytes[offset + 3].toInt() and 0xFF)
    }

    /**
     * 读取文件全部字节。支持 file://、content:// 和绝对路径。
     */
    private fun readFileBytes(uriString: String): ByteArray? {
        val cleanUri = uriString.trim()
        val inputStream: InputStream = when {
            cleanUri.startsWith("content://") -> {
                reactApplicationContext.contentResolver.openInputStream(Uri.parse(cleanUri))
                    ?: return null
            }
            cleanUri.startsWith("file://") -> {
                FileInputStream(File(cleanUri.removePrefix("file://")))
            }
            cleanUri.startsWith("/") -> {
                FileInputStream(File(cleanUri))
            }
            else -> {
                try {
                    reactApplicationContext.contentResolver.openInputStream(Uri.parse(cleanUri))
                        ?: return null
                } catch (_: Exception) {
                    return null
                }
            }
        }

        return inputStream.use { it.readBytes() }
    }

    private fun createNegativeResult(): WritableMap {
        return Arguments.createMap().apply {
            putBoolean("isMotionPhoto", false)
        }
    }
}
