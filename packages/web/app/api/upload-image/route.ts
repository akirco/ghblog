import { getGitHubClient } from "@/lib/github";
import { formatFileSize, generateImagePath } from "@/lib/image-utils";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)}` },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    console.log("Processing image:", file.name, formatFileSize(file.size));

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const compressedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
    const base64Content = compressedBuffer.toString("base64");

    console.log("Base64 size:", formatFileSize(base64Content.length));

    // 生成文件路径
    const imagePath = generateImagePath(file.name);

    console.log("Uploading to GitHub:", imagePath);

    // 上传到 GitHub
    const githubClient = getGitHubClient();
    const result = await githubClient.uploadImage(
      imagePath,
      base64Content,
      `Upload image: ${file.name}`
    );

    console.log("Upload successful:", result.url);

    return NextResponse.json({
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 }
    );
  }
}
