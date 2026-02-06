import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code';

export default {
  name: 'Lunar Ring',
  description: 'An ethereal glowing ring reminiscent of a lunar eclipse or celestial halo',
  author: {
    name: "Ninjafire",
    imageUrl: 'https://pbs.twimg.com/profile_images/2006007847742758912/nWXptCKJ_400x400.jpg',
    redirectUrl: 'https://ninjafire.xyz'
  },
  tags: ['shader', 'webgl2', 'minimal', 'glow', 'ring'],
  defaultProps: {
    frequency: 1.0,
    amplitude: 1.0,
    intensity: 1.0,
    rotation: 0,
    translateX: 0,
    translateY: 0,
    color: '#000000',
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
      key: 'color',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#000000',
      description: 'Background hex color',
    },
    {
      key: 'frequency',
      label: 'Frequency',
      type: 'slider',
      min: 0.1,
      max: 5.0,
      step: 0.1,
      defaultValue: 1.0,
      description: 'Noise frequency/scale',
    },
    {
      key: 'amplitude',
      label: 'Amplitude',
      type: 'slider',
      min: 0.1,
      max: 2.0,
      step: 0.1,
      defaultValue: 1.0,
      description: 'Signal amplitude',
    },
    {
      key: 'intensity',
      label: 'Intensity',
      type: 'slider',
      min: 0.1,
      max: 3.0,
      step: 0.1,
      defaultValue: 1.0,
      description: 'Glow intensity',
    },
    {
      key: 'rotation',
      label: 'Rotation',
      type: 'slider',
      min: 0,
      max: 6.28, // 2 * PI
      step: 0.1,
      defaultValue: 0,
      description: 'Rotation (radians)',
    },
    {
      key: 'translateX',
      label: 'Position X',
      type: 'slider',
      min: -1.5,
      max: 2.1,
      step: 0.1,
      defaultValue: 0,
      description: 'Horizontal translation',
    },
    {
      key: 'translateY',
      label: 'Position Y',
      type: 'slider',
      min: -1.5,
      max: 1.5,
      step: 0.1,
      defaultValue: 0,
      description: 'Vertical translation',
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
