import { BackgroundConfig } from '@/lib/types';
import { tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code'

export default {
  name: 'Matrix',
  description: 'Smooth animated Heaxagons patterns that glows and leave a mark',
  author: 'NetMods',
  tags: ['animated', 'gradient', 'waves'],
  defaultProps: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    textColor: '#0F0'
  },
  code: {
    usage: usageCodeHTML,
    rawUsage: usageCode,
    tsx: tsxCodeHTML,
    jsx: jsxCodeHTML
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
} as Omit<BackgroundConfig, 'id'>;
