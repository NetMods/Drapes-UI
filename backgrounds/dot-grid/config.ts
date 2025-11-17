import { BackgroundConfig } from '@/lib/types';
import { tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code'

export default {
  name: 'Dot Grid',
  description: 'A dynamic background featuring a grid of dots that smoothly scale and animate on hover interaction.',
  author: 'NetMods',
  tags: ['animated', 'dotted-grids', 'waves', 'interactive', 'hover-effects', 'geometric'],

  defaultProps: {
    dotSpacing: 30,
    dotBaseSize: 2,
    influenceRadius: 150,
    maxScale: 8,
    backgroundColor: '#0a0a0a',
    glowColor: '#8b5cf6',
    numLayers: 2,
    hiddots: true,
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
      defaultValue: '#0a0a0a',
      description: 'The overall background color for the dot grid.',
    },
    {
      key: 'glowColor',
      label: 'Glow Color',
      type: 'color',
      defaultValue: '#8b5cf6',
      description: 'The color applied to scaled dots for a glowing effect on hover.',
    },
    {
      key: 'dotSpacing',
      label: 'Dot Spacing',
      type: 'slider',
      min: 20,
      max: 50,
      step: 10,
      defaultValue: 30,
      description: 'The distance between individual dots in the grid.',
    },
    {
      key: 'dotBaseSize',
      label: 'Dot Size',
      type: 'slider',
      min: 0.5,
      max: 5,
      step: 0.1,
      defaultValue: 2,
      description: 'The base size of each dot in the grid.',
    },
    {
      key: 'maxScale',
      label: 'Scaled Dots Size',
      type: 'slider',
      min: 0,
      max: 20,
      step: 2,
      defaultValue: 8,
      description: 'The maximum scale factor applied to dots during hover interaction.',
    },
    {
      key: 'influenceRadius',
      label: 'Influence Radius',
      type: 'slider',
      min: 0,
      max: 400,
      step: 10,
      defaultValue: 150,
      description: 'The radius within which dots respond to hover by scaling.',
    },
    {
      key: 'numLayers',
      label: 'Number of Layers',
      type: 'slider',
      min: 0,
      max: 10,
      step: 1,
      defaultValue: 2,
      description: 'The number of overlapping dot grid layers for added depth.',
    },
    {
      key: "hiddots",
      label: "Hide Dots",
      value: false,
      type: 'toggle',
      description: "Hide the dots and only show when hovered"
    }
  ],
} as Omit<BackgroundConfig, 'id'>;
