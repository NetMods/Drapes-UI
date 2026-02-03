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


export interface ScreenCaptureOptions {
  delay?: number;
  filename?: string;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
}

export const captureScreenshot = async (
  canvas: HTMLCanvasElement | null,
  options: ScreenCaptureOptions = {}
): Promise<{ success: boolean; error?: string }> => {
  const {
    delay = 0,
    filename = 'drapes-screenshot',
    format = 'png',
    quality = 1.0
  } = options;

  if (!canvas) {
    return { success: false, error: 'Canvas element not found' };
  }

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    const mimeType = `image/${format}`;
    const dataURL = canvas.toDataURL(mimeType, quality);

    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

export const getCanvasElement = (): HTMLCanvasElement | null => {
  return document.querySelector('canvas');
};

export interface RecordingOptions {
  frameRate?: number;
  maxDuration?: number;
  filename?: string;
}

export interface RecordingController {
  stop: () => void;
  isRecording: () => boolean;
}

export const startCanvasRecording = (
  canvas: HTMLCanvasElement | null,
  options: RecordingOptions = {},
  onStop?: () => void
): RecordingController | null => {
  const {
    frameRate = 30,
    maxDuration = 30000,
    filename = 'drapes-recording'
  } = options;

  if (!canvas) {
    console.error('Canvas element not found');
    return null;
  }

  let isActive = true;
  const chunks: Blob[] = [];

  const stream = canvas.captureStream(frameRate);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9'
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    isActive = false;
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${filename}.webm`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    onStop?.();
  };

  mediaRecorder.start();

  const timeoutId = setTimeout(() => {
    if (isActive && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, maxDuration);

  return {
    stop: () => {
      clearTimeout(timeoutId);
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    },
    isRecording: () => isActive && mediaRecorder.state === 'recording'
  };
};

// For this to work in webgl canvas, u need to have this in bg - canvas.getContext('webgl', { preserveDrawingBuffer: true });
/*
(async () => {
  const { captureCanvasScreenshot } = await import('@/lib/utils');
  await captureCanvasScreenshot(canvasRef, "example.webp");
})()
* */
