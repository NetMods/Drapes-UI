import { BackgroundConfig } from '@/lib/types';
import { tsxCode, jsxCode, usageCode } from './code'

export default {
  id: '9',
  name: 'Matrix',
  description: 'Smooth animated Heaxagons patterns that glows and leave a mark',
  author: 'NetMods',
  tags: ['animated', 'gradient', 'waves'],
  defaultProps: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    textColor: '#0F0'
  },
  code: {
    usage: usageCode,
    tsx: tsxCode,
    jsx: jsxCode
  },
  controls: [
    {
      key: 'backgroundColor',
      label: 'background Color',
      type: 'color',
      defaultValue: 'rgba(0, 0, 0, 0.05)',
      description: 'backgroundColor',
    },
    {
      key: 'textColor',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#0F0',
      description: 'Text Color',
    },
  ],
} as BackgroundConfig;
