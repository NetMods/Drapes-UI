import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code';

export default {
  name: 'Snowfall',
  description: 'High-performance procedural snowfall using WebGL Fragment Shaders with gradient backgrounds.',
  author: {
    name: "Aryan",
    imageUrl: 'https://pbs.twimg.com/profile_images/1927618320246919168/nvaCh-o8_400x400.jpg',
    redirectUrl: 'https://tarnished.lol'
  },
  tags: ['webgl', 'shader', 'snow', 'procedural', 'performance', 'gpu'],
  defaultProps: {
    snowflakeCount: 20,
    speed: 0.4,
    windSpeed: 0.5,
    color: '#ffffff',
    gradientColorTop: '#000000',
    gradientColorBottom: '#1C5182',
    renderScale: 0.5,
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
      key: 'color',
      label: 'Snow Color',
      type: 'color',
      defaultValue: '#ffffff',
      description: 'Color of the snowflakes (passed as a Uniform vec3).',
    },
    {
      key: 'gradientColorTop',
      label: 'Sky Top',
      type: 'color',
      defaultValue: '#000000',
      description: 'Color at the top of the background gradient.',
    },
    {
      key: 'gradientColorBottom',
      label: 'Sky Bottom',
      type: 'color',
      defaultValue: '#0b1026',
      description: 'Color at the bottom of the background gradient.',
    },
    {
      key: 'snowflakeCount',
      label: 'Density',
      type: 'slider',
      min: 10,
      max: 100,
      step: 1,
      defaultValue: 20,
      description: 'Number of parallax layers/loops in the shader.',
    },
    {
      key: 'speed',
      label: 'Fall Speed',
      type: 'slider',
      min: 0.1,
      max: 3.0,
      step: 0.1,
      defaultValue: 0.4,
      description: 'Time multiplier for the falling animation.',
    },
    {
      key: 'windSpeed',
      label: 'Wind',
      type: 'slider',
      min: -2.0,
      max: 2.0,
      step: 0.1,
      defaultValue: 0.5,
      description: 'Horizontal movement multiplier.',
    },
    {
      key: 'renderScale',
      label: 'Resolution Scale',
      type: 'slider',
      min: 0.1,
      max: 2.0,
      step: 0.1,
      defaultValue: 0.5,
      description: 'Internal canvas resolution. Lower values (e.g., 0.5) improve performance significantly.',
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
