import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code'

export default {
  name: 'Mist',
  description: 'A mesmerizing animated shader background featuring flowing mist-like patterns with fractal noise and smooth color transitions.',
  author: {
    name: "Aryan",
    imageUrl: 'https://pbs.twimg.com/profile_images/1927618320246919168/nvaCh-o8_400x400.jpg',
    redirectUrl: 'https://tarnished.lol'
  },
  tags: ['animated', 'shader', 'webgl', 'fluid', 'organic', 'atmospheric', 'noise'],
  defaultProps: {
    scale: 3.0,
    speed: 1.0,
    autoPlay: true,
    color1: '#1a9eaa',
    color2: '#aaaaaa',
    color3: '#00002a',
    color4: '#aaffff',
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
      key: 'color1',
      label: 'Primary Color',
      type: 'color',
      defaultValue: '#1a9eaa',
      description: 'The primary color used in the mist pattern (teal base).',
    },
    {
      key: 'color2',
      label: 'Secondary Color',
      type: 'color',
      defaultValue: '#aaaaaa',
      description: 'The secondary color blended into the pattern (gray).',
    },
    {
      key: 'color3',
      label: 'Dark Accent',
      type: 'color',
      defaultValue: '#00002a',
      description: 'The dark accent color for depth (deep blue).',
    },
    {
      key: 'color4',
      label: 'Highlight Color',
      type: 'color',
      defaultValue: '#aaffff',
      description: 'The highlight color for bright areas (cyan).',
    },
    {
      key: 'scale',
      label: 'Pattern Scale',
      type: 'slider',
      min: 1.0,
      max: 8.0,
      step: 0.5,
      defaultValue: 3.0,
      description: 'Controls the zoom level and detail of the mist pattern.',
    },
    {
      key: 'speed',
      label: 'Animation Speed',
      type: 'slider',
      min: 0.0,
      max: 3.0,
      step: 0.1,
      defaultValue: 1.0,
      description: 'Controls how fast the mist animates and flows.',
    },
    {
      key: 'autoPlay',
      label: 'Auto Play',
      type: 'toggle',
      defaultValue: true,
      description: 'Automatically animate the mist pattern.',
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
