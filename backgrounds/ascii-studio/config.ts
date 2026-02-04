import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code'

export default {
  name: 'ASCII Studio',
  description: 'A real-time ASCII art renderer that converts images and videos into text-based art using various character sets.',
  author: {
    name: "Ninjafire",
    imageUrl: 'https://pbs.twimg.com/profile_images/2006007847742758912/nWXptCKJ_400x400.jpg',
    redirectUrl: 'https://ninjafire.xyz'
  },
  tags: ['ascii', 'retro', 'canvas', 'image-processing', 'video', 'text-art', 'terminal'],
  defaultProps: {
    mediaType: 'image',
    asciiMode: 'standard',
    source: '/data/zoro.jpg',
    objectFit: 'cover',
    fontSize: 8,
    color: '#eeeeee',
    backgroundColor: '#000000',
    inverted: false,
    colored: true,
  },
  code: {
    usage: usageCodeHTML,
    rawUsage: usageCode,
    tsx: tsxCodeHTML,
    jsx: jsxCodeHTML,
    rawjsx: jsxCode,
    rawtsx: tsxCode
  },
  controls: [
    {
      key: 'mediaType',
      label: 'Media Type',
      type: 'select',
      options: ['image', 'video'],
      defaultValue: 'image',
      description: 'Choose between processing a static image or a looping video.',
    },
    {
      key: 'source',
      label: 'Media Source',
      type: 'media-input',
      defaultValue: '/data/zoro.jpg',
      defaultImage: '/data/zoro.jpg',
      defaultVideo: '/data/zoro.mp4',
      description: 'Upload an image or video file to convert to ASCII art.',
      mediaTypeKey: 'mediaType',
    },
    {
      key: 'objectFit',
      label: 'Object Fit',
      type: 'select',
      options: ['contain', 'cover', 'fill'],
      defaultValue: 'conver',
      description: 'Control how the media fits within the canvas (contain, cover, or fill).',
    },
    {
      key: 'asciiMode',
      label: 'ASCII Style',
      type: 'select',
      options: ['standard', 'technical', 'dense', 'minimal', 'blocks', 'braille', 'hatching'],
      defaultValue: 'standard',
      description: 'Select the character set for ASCII rendering.',
    },
    {
      key: 'fontSize',
      label: 'Character Size',
      type: 'slider',
      min: 4,
      max: 24,
      step: 1,
      defaultValue: 8,
      description: 'Adjust the size of ASCII characters (smaller = more detail).',
    },
    {
      key: 'color',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#00ff00',
      description: 'Set the color of the ASCII characters.',
    },
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#000000',
      description: 'Set the background color of the canvas.',
    },
    {
      key: 'inverted',
      label: 'Invert Brightness',
      type: 'toggle',
      defaultValue: false,
      description: 'Invert the character mapping for light-on-dark sources.',
    },
    {
      key: 'colored',
      label: 'Colored',
      type: 'toggle',
      defaultValue: true,
      description: 'Enable colored mode for ASCII art.',
    },

  ],
} as Omit<BackgroundConfig, 'id'>;
