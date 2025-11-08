import { saveThumbnailAction } from "@/actions/saveThumbnail";

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

/*
(async () => {
  const { captureCanvasScreenshot } = await import('@/lib/utils');
  await captureCanvasScreenshot(canvasRef, "wave-gradient.webp");
})()
* */

