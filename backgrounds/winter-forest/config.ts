import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code';

export default {
  name: 'Winter Forest',
  description: 'A serene winter scene with parallax trees and gently falling snow',
  author: {
    name: "Aryan",
    imageUrl: 'https://pbs.twimg.com/profile_images/1927618320246919168/nvaCh-o8_400x400.jpg',
    redirectUrl: 'https://tarnished.lol'
  },
  tags: ['canvas', '2d', 'animated', 'winter', 'snow', 'trees'],
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
