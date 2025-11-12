'use server'

import fs from 'fs';
import path from 'path';

export async function saveThumbnailAction(dataURL: string, filename: string) {
  try {
    const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');

    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    const filePath = path.join(thumbnailsDir, filename);
    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      path: `/thumbnails/${filename}`,
      message: `Saved to /public/thumbnails/${filename}`
    };
  } catch (error) {
    console.error('Error saving thumbnail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save thumbnail'
    };
  }
}
