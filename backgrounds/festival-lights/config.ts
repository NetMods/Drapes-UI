import { BackgroundConfig } from '@/lib/types';
import { tsxCode, jsxCode, usageCode } from './code'

export default {
  id: '4',
  name: 'Festival Lights',
  description: 'Smooth animated Lights pattern with gradient background',
  author: 'NetMods',
  tags: ['animated', 'gradient', 'waves'],
  thumbnail: '/thumbnails/wave-gradient.webp',
  defaultProps: {
    numberOfCircles: 50,
    radiusMultiplier: 9,
    backgroundGradientStart: "#1a0003",
    backgroundGradientEnd: '#d58801',
  },
  code: {
    usage: usageCode,
    tsx: tsxCode,
    jsx: jsxCode
  },
  controls: [
    {
      key: 'numberOfCircles',
      label: 'Circles',
      type: 'slider',
      min: 0,
      max: 100,
      step: 10,
      defaultValue: 50,
    },
    {
      key: 'radiusMultiplier',
      label: 'Radius Divider',
      type: 'slider',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 3,
    },
    {
      key: 'backgroundGradientStart',
      label: 'Background Start',
      type: 'color',
      defaultValue: '#1a0003',
      description: 'Starting gradient color',
    },
    {
      key: 'backgroundGradientEnd',
      label: 'Background End',
      type: 'color',
      defaultValue: '#d58801',
      description: 'Ending gradient color',
    },
  ],
} as BackgroundConfig;
