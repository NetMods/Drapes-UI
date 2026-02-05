import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code';

export default {
  name: 'Vortex Twist',
  description: 'A mesmerizing twisted vortex with swirling patterns and dynamic color shifts',
  author: {
    name: "Ninjafire",
    imageUrl: 'https://pbs.twimg.com/profile_images/2006007847742758912/nWXptCKJ_400x400.jpg',
    redirectUrl: 'https://ninjafire.xyz'
  },
  tags: ['shader', 'webgl2', 'animated', 'vortex', 'abstract'],
  defaultProps: {
    speed: 1.0,
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
      key: 'speed',
      label: 'Speed',
      type: 'slider',
      min: 0.1,
      max: 3,
      step: 0.1,
      defaultValue: 1.0,
      description: 'Animation speed',
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
