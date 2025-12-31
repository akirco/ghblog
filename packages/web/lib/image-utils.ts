// 图片压缩和处理工具

export interface CompressImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: "jpeg" | "png" | "webp"
}

export async function compressImageFromFile(file: File, options: CompressImageOptions = {}): Promise<string> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = "jpeg" } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // 计算新尺寸，保持宽高比
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // 转换为 base64
        const mimeType = `image/${format}`
        const base64 = canvas.toDataURL(mimeType, quality)

        // 移除 data URL 前缀，只保留 base64 数据
        const base64Data = base64.split(",")[1]
        resolve(base64Data)
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

// 生成按日期分类的文件路径
export function generateImagePath(filename: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  // 生成唯一文件名（时间戳 + 随机字符串）
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = filename.split(".").pop()
  const newFilename = `${timestamp}-${random}.${ext}`

  return `images/${year}/${month}/${day}/${newFilename}`
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}
