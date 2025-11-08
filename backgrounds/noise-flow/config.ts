import { BackgroundConfig } from '@/lib/types';
import { tsxCode, jsxCode, usageCode } from './code'

export default {
  id: '6',
  name: 'Noise-Fields',
  description: 'Noise fields foloowing the flow field',
  author: 'NetMods',
  tags: ['animated', 'gradient', 'waves'],
  thumbnail: '/thumbnails/wave-gradient.webp',
  defaultProps: {
    backgroundColor: 'black',
    particleNum: 1000,
    step: 5,
    base: 1000,
    zInc: 0.001,
  },
  code: {
    usage: usageCode,
    tsx: tsxCode,
    jsx: jsxCode
  },
  controls: [
    {
      key: 'backgroundColor',
      label: 'Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Color for the background',
    },
    {
      key: 'particleNum',
      label: 'Offset',
      type: 'slider',
      min: 0,
      max: 5000,
      step: 500,
      defaultValue: 1000,
    },
    {
      key: 'step',
      label: 'Step',
      type: 'slider',
      min: 0,
      max: 20,
      step: 1,
      defaultValue: 5,
    },
    {
      key: 'base',
      label: 'base',
      type: 'slider',
      min: 0,
      max: 5000,
      step: 500,
      defaultValue: 1000,
    },
  ],
} as BackgroundConfig;
