import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code';

export default {
  name: 'Orbital',
  description: 'A stippled orbital pattern with concentric rings of dots and a paper-grain post-processing effect.',
  author: {
    name: "Aryan",
    imageUrl: 'https://pbs.twimg.com/profile_images/1927618320246919168/nvaCh-o8_400x400.jpg',
    redirectUrl: 'https://tarnished.lol'
  },
  tags: ['webgl', 'dots', 'stipple', 'grain', 'generative', 'static'],
  defaultProps: {
    centerX: 0.5,
    centerY: 1.1,
    seed: 42,
    sizeRatio: 1.5,
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
      key: 'centerX',
      label: 'Center X',
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: 0.5,
      description: 'Horizontal position of the orbital center (0 = left, 1 = right).',
    },
    {
      key: 'centerY',
      label: 'Center Y',
      type: 'slider',
      min: 0,
      max: 2,
      step: 0.05,
      defaultValue: 1.1,
      description: 'Vertical position of the orbital center (0 = top, 2 = below screen).',
    },
    {
      key: 'seed',
      label: 'Seed',
      type: 'slider',
      min: 1,
      max: 1000,
      step: 1,
      defaultValue: 42,
      description: 'Random seed for the dot pattern generation.',
    },
    {
      key: 'sizeRatio',
      label: 'Size Ratio',
      type: 'slider',
      min: 0.5,
      max: 3,
      step: 0.1,
      defaultValue: 1.5,
      description: 'Scale factor for the overall orbital pattern size.',
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
