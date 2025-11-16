import { BackgroundConfig } from '@/lib/types';
import { tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code'

export default {
  name: 'Matrix',
  description: 'A mesmerizing Matrix-style animation with streams of falling digital numbers and characters cascading down the screen like digital rain.',
  author: 'NetMods',
  tags: ['animated', 'matrix', 'digital-rain', 'falling-numbers', 'cyberpunk', 'text-animation', 'green-glow'],
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
      label: 'Background Color',
      type: 'color',
      defaultValue: 'rgba(0, 0, 0, 0.05)',
      description: 'The subtle, semi-transparent dark background that enhances the falling effect.',
    },
    {
      key: 'textColor',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#0F0',
      description: 'The glowing color of the falling numbers and digital characters.',
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
