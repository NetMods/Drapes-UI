import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code'

export default {
  name: 'Fractal Tree',
  description: 'A generative organic tree structure that grows recursively. It features expanding branches that fade over time, creating a subtle, frost-like or vascular pattern.',
  author: 'NetMods',
  imageUrl: 'https://pbs.twimg.com/profile_images/1927618320246919168/nvaCh-o8_400x400.jpg',
  tags: ['fractal', 'tree', 'generative', 'organic', 'nature', 'recursive'],
  defaultProps: {
    primaryColor: 'rgba(200,200,200, 1)',
    maxDepth: 30,
    branchLength: 6,
    branchProbability: 0.5,
    growthSpeed: 40,
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
      key: 'primaryColor',
      label: 'Branch Color',
      type: 'color',
      defaultValue: 'rgba(200, 200, 200, 1)',
      description: 'The color of the tree branches. Low opacity works best for layering.',
    },
    {
      key: 'maxDepth',
      label: 'Max Depth',
      type: 'slider',
      min: 10,
      max: 100,
      step: 5,
      defaultValue: 50,
      description: 'Determines how many iterations a branch can grow before stopping.',
    },
    {
      key: 'branchLength',
      label: 'Branch Length',
      type: 'slider',
      min: 2,
      max: 20,
      step: 1,
      defaultValue: 6,
      description: 'The length of individual segments. Larger numbers make "looser" trees.',
    },
    {
      key: 'branchProbability',
      label: 'Branch Probability',
      type: 'slider',
      min: 0.1,
      max: 0.9,
      step: 0.1,
      defaultValue: 0.5,
      description: 'The chance that a branch will split into two. Higher values = denser trees.',
    },
    {
      key: 'growthSpeed',
      label: 'Growth Interval (ms)',
      type: 'slider',
      min: 10,
      max: 100,
      step: 5,
      defaultValue: 40,
      description: 'Time in milliseconds between growth steps. Lower is faster.',
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
