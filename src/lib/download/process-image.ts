import sharp from "sharp";
import { getResolutionConfig, type ResolutionPreset } from "./presets";
import {
  generateWatermarkBuffer,
  getWatermarkPosition,
  calculateWatermarkDimensions,
} from "./watermark";

export interface ProcessImageOptions {
  resolution: ResolutionPreset;
  watermark: boolean;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: "jpeg";
}

export async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function processImage(
  imageBuffer: Buffer,
  options: ProcessImageOptions
): Promise<ProcessedImage> {
  const { resolution, watermark } = options;
  const config = getResolutionConfig(resolution);

  // Get original image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width || 1920;
  const originalHeight = metadata.height || 1080;

  // Calculate target dimensions (preserve aspect ratio)
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (config.maxWidth && config.maxHeight) {
    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > config.maxWidth || originalHeight > config.maxHeight) {
      if (originalWidth / config.maxWidth > originalHeight / config.maxHeight) {
        // Width is the limiting factor
        targetWidth = config.maxWidth;
        targetHeight = Math.round(config.maxWidth / aspectRatio);
      } else {
        // Height is the limiting factor
        targetHeight = config.maxHeight;
        targetWidth = Math.round(config.maxHeight * aspectRatio);
      }
    }
  }

  // Start the processing pipeline
  let pipeline = sharp(imageBuffer);

  // Resize if needed
  if (targetWidth !== originalWidth || targetHeight !== originalHeight) {
    pipeline = pipeline.resize(targetWidth, targetHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Get the current state for watermarking
  let processedBuffer = await pipeline.jpeg({ quality: config.quality }).toBuffer();

  // Apply watermark if requested
  if (watermark) {
    // Get the actual dimensions after resize
    const resizedMetadata = await sharp(processedBuffer).metadata();
    const finalWidth = resizedMetadata.width || targetWidth;
    const finalHeight = resizedMetadata.height || targetHeight;

    // Generate watermark
    const watermarkDimensions = calculateWatermarkDimensions(finalWidth);
    const watermarkBuffer = generateWatermarkBuffer({
      imageWidth: finalWidth,
      imageHeight: finalHeight,
    });

    // Calculate position
    const position = getWatermarkPosition(
      finalWidth,
      finalHeight,
      watermarkDimensions.width,
      watermarkDimensions.height
    );

    // Composite the watermark onto the image
    processedBuffer = await sharp(processedBuffer)
      .composite([
        {
          input: watermarkBuffer,
          left: position.left,
          top: position.top,
        },
      ])
      .jpeg({ quality: config.quality })
      .toBuffer();
  }

  // Get final dimensions
  const finalMetadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    width: finalMetadata.width || targetWidth,
    height: finalMetadata.height || targetHeight,
    format: "jpeg",
  };
}

// Process multiple images and return them for ZIP creation
export async function processImagesForBatch(
  images: Array<{ url: string; filename: string }>,
  options: ProcessImageOptions
): Promise<Array<{ filename: string; buffer: Buffer }>> {
  const results: Array<{ filename: string; buffer: Buffer }> = [];

  for (const image of images) {
    try {
      const imageBuffer = await fetchImageBuffer(image.url);
      const processed = await processImage(imageBuffer, options);
      results.push({
        filename: image.filename,
        buffer: processed.buffer,
      });
    } catch (error) {
      console.error(`Failed to process image ${image.filename}:`, error);
      // Skip failed images but continue with others
    }
  }

  return results;
}
