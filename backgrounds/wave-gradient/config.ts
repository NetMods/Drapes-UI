import { BackgroundConfig } from '@/lib/types';
import { tsxCode, jsxCode, usageCode } from './code'

export default {
  id: '1',
  name: 'Wave Gradient',
  description: 'Smooth animated wave patterns with gradient colors',
  author: 'John',
  tags: ['animated', 'gradient', 'waves'],
  thumbnail: '/thumbnails/wave-gradient.webp',
  defaultProps: {
    color1: '#6366f1',
    color2: '#8b5cf6',
    amplitude: 50,
    frequency: 2,
    speed: 1,
  },
  code: {
    usage: usageCode,
    tsx: tsxCode,
    jsx: jsxCode
  },
  controls: [
    {
      key: 'color1',
      label: 'Primary Color',
      type: 'color',
      defaultValue: '#6366f1',
      description: 'Starting gradient color',
    },
    {
      key: 'color2',
      label: 'Secondary Color',
      type: 'color',
      defaultValue: '#8b5cf6',
      description: 'Ending gradient color',
    },
    {
      key: 'amplitude',
      label: 'Wave Height',
      type: 'slider',
      min: 10,
      max: 200,
      step: 5,
      defaultValue: 50,
    },
    {
      key: 'frequency',
      label: 'Wave Frequency',
      type: 'slider',
      min: 0.5,
      max: 5,
      step: 0.1,
      defaultValue: 2,
    },
    {
      key: 'speed',
      label: 'Animation Speed',
      type: 'slider',
      min: 0,
      max: 3,
      step: 0.1,
      defaultValue: 1,
    },
  ],
} as BackgroundConfig;
