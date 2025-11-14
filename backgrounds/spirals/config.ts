import { BackgroundConfig } from '@/lib/types';
import { tsxCode, jsxCode, usageCode } from './code'

export default {
  name: 'Spirals',
  description: 'Mathematical spirals that spins based on your choice of rotaion',
  author: 'NetMods',
  tags: ['animated', 'gradient', 'waves'],
  defaultProps: {
    maxOffset: 400,
    spacing: 3,
    pointsPerLap: 6,
    shadowStrength: 6,
    primaryColor: '#fff',
    secondaryColor: '#fff',
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
      key: 'primaryColor',
      label: 'Primary Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Stroke color for spiral',
    },
    {
      key: 'secondaryColor',
      label: 'Secondary Color',
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
      defaultValue: 3,
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
} as Omit<BackgroundConfig, 'id'>;
