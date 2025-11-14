import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { saveThumbnailAction } from "@/actions/saveThumbnail";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundToDecimalPlaces(value: number, decimalPlaces: number) {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

export const captureCanvasScreenshot = async (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  filename: string,
  delay?: number
) => {
  const canvas = canvasRef.current;
  if (!canvas) {
    console.error('Canvas ref is null');
    return { success: false, error: 'Canvas ref is null' };
  }

  const format = 'webp';
  const quality = 0.92;
  const mimeType = `image/${format}`;

  await new Promise(resolve => setTimeout(resolve, delay ?? 100));

  try {
    const dataURL = canvas.toDataURL(mimeType, quality);
    const result = await saveThumbnailAction(dataURL, filename);

    if (result.success) {
      console.log(`✓ ${result.message}`);
    } else {
      console.error('Failed to save thumbnail:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Failed to capture canvas screenshot:', error);
    return null;
  }
};

// For this to work in webgl canvas, u need to have this in bg - canvas.getContext('webgl', { preserveDrawingBuffer: true });
/*
(async () => {
  const { captureCanvasScreenshot } = await import('@/lib/utils');
  await captureCanvasScreenshot(canvasRef, "example.webp");
})()
* */
