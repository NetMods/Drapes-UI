import { BackgroundConfig } from '@/lib/types';
import { tsxCode, jsxCode, usageCode } from './code'
export default {
  id: '4',
  name: 'Festival Lights',
  description: 'A vibrant, animated background featuring floating light patterns that dance smoothly over a mesmerizing gradient.',
  author: 'NetMods',
  tags: ['animated', 'gradient', 'waves', 'lights', 'festival', 'patterns', 'abstract'],
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
      label: 'Number of Circles',
      type: 'slider',
      min: 0,
      max: 100,
      step: 10,
      defaultValue: 50,
      description: 'The total number of animated light circles in the pattern.',
    },
    {
      key: 'radiusMultiplier',
      label: 'Radius Multiplier',
      type: 'slider',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 9,
      description: 'The multiplier applied to scale the radius of each light circle.',
    },
    {
      key: 'backgroundGradientStart',
      label: 'Background Gradient Start',
      type: 'color',
      defaultValue: '#1a0003',
      description: 'The starting color of the gradient background.',
    },
    {
      key: 'backgroundGradientEnd',
      label: 'Background Gradient End',
      type: 'color',
      defaultValue: '#d58801',
      description: 'The ending color of the gradient background.',
    },
  ],
} as BackgroundConfig;
