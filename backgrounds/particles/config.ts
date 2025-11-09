import { BackgroundConfig } from '@/lib/types';
import { tsxCode, jsxCode, usageCode } from './code'

export default {
  id: '2',
  name: 'Particles',
  description: 'Smooth animated Confetti that follows your mouse',
  author: 'NetMods',
  tags: ['animated', 'confetti', 'Follow'],
  thumbnail: '/thumbnails/wave-gradient.webp',
  defaultProps: {
    numConfetti: 350
  },
  code: {
    usage: usageCode,
    tsx: tsxCode,
    jsx: jsxCode
  },
  controls: [
    {
      key: 'numConfetti',
      label: 'Number pf Confetti',
      type: 'slider',
      min: 10,
      max: 500,
      step: 20,
      defaultValue: 350,
    },
  ],
} as BackgroundConfig;
