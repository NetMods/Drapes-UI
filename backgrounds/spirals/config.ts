import { BackgroundConfig } from '@/lib/types';
import { tsxCode, jsxCode, usageCode } from './code'

export default {
  id: '5',
  name: 'Spirals',
  description: 'Mathematical spirals that spins based on your choice of rotaion',
  author: 'NetMods',
  tags: ['animated', 'gradient', 'waves'],
  thumbnail: '/thumbnails/wave-gradient.webp',
  defaultProps: {
    maxOffset: 400,
    spacing: 4,
    pointsPerLap: 6,
    shadowStrength: 6,
    strokeColor: '#fff',
    shadowColor: '#fff',
    lineWidth: 2,
    initialVelocity: 0.1,
  },
  code: {
    usage: usageCode,
    tsx: tsxCode,
    jsx: jsxCode
  },
  controls: [
    {
      key: 'strokeColor',
      label: 'Stroke Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Stroke color for spiral',
    },
    {
      key: 'shadowColor',
      label: 'Shadow Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Shadow Color for spiral',
    },
    {
      key: 'maxOffset',
      label: 'Offset',
      type: 'slider',
      min: 10,
      max: 1000,
      step: 50,
      defaultValue: 400,
    },
    {
      key: 'spacing',
      label: 'Spacing',
      type: 'slider',
      min: 3,
      max: 10,
      step: 1,
      defaultValue: 4,
    },
    {
      key: 'lineWidth',
      label: 'Line Width',
      type: 'slider',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 2,
    },
    {
      key: 'initialVelocity',
      label: 'Initial Velocity',
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 0.5,
    },

  ],
} as BackgroundConfig;
