import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code'

export default {
  name: 'Matrix',
  description: 'A mesmerizing Matrix-style animation with streams of falling digital numbers and characters cascading down the screen like digital rain.',
  author: {
    name: "Aryan",
    imageUrl: 'https://pbs.twimg.com/profile_images/1927618320246919168/nvaCh-o8_400x400.jpg',
    redirectUrl: 'https://tarnished.lol'
  },
  tags: ['animated', 'matrix', 'digital-rain', 'falling-numbers', 'cyberpunk', 'text-animation', 'green-glow'],
  defaultProps: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    textColor: '#0F0',
    fontSize: 14,
    speed: 33,
    hasNumbers: false,
    language: 'japanese',
    trailLength: 1.0
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
    {
      key: 'fontSize',
      label: 'Font Size',
      type: 'slider',
      min: 1,
      max: 100,
      step: 0.1,
      defaultValue: 14,
      description: 'The size of the characters and column width in pixels.',
    },
    {
      key: 'speed',
      label: 'Speed (ms)',
      type: 'slider',
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 33,
      description: 'The refresh rate in milliseconds. Lower numbers create faster rain.',
    },
    {
      key: 'hasNumbers',
      label: 'Include Numbers',
      type: 'toggle',
      defaultValue: false,
      description: 'Whether to mix numbers (0-9) into the falling character streams.',
    },
    {
      key: 'language',
      label: 'Language',
      type: 'select',
      options: ['japanese', 'chinese', 'korean', 'english', 'russian'],
      defaultValue: 'japanese',
      description: 'The character set used for the digital rain.',
    },
    {
      key: 'trailLength',
      label: 'Trail Length',
      type: 'slider',
      min: 0.2,
      max: 3.0,
      step: 0.1,
      defaultValue: 1.0,
      description: 'Controls the length of character trails. Higher values create longer, more dramatic trails.',
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
