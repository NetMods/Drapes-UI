import { serverRegistry } from '@/lib/server-registry';
import { BackgroundConfig } from '@/lib/types';

import particlesConfig from './particles/config';
import auraRingConfig from './aura-ring/config';
import horizonGlowConfig from './horizon-glow/config';
import ditherStudioConfig from './dither-studio/config';
import mistConfig from './mist/config';
import neonHighwayConfig from './neon-highway/config';
import asciiStudioConfig from './ascii-studio/config';
import waveColumnsConfig from './wave-columns/config';
import fractalTreeConfig from './fractal-tree/config';
import cyberGridConfig from './cyber-grid/config';
import plasmaWaveConfig from './plasma-wave/config';
import distortedRippleConfig from './distorted-ripple/config';
import chromaticSpiralConfig from './chromatic-spiral/config';
import fluidLinesConfig from './fluid-lines/config';
import bitmapNoiseConfig from './bitmap-noise/config';
import matrixConfig from './matrix/config';
import solarFlareConfig from './solar-flare/config';
import fireflyEffectConfig from './firefly-effect/config';
import vortexTwistConfig from './vortex-twist/config';
import snowFallConfig from './snow-fall/config';
import mosaicFlowConfig from './mosaic-flow/config';
import lunarRingConfig from './lunar-ring/config';
import spiralsConfig from './spirals/config';
import cellularConfig from './cellular/config';
import noiseFieldConfig from './noise-field/config';
import kaleidoscopeConfig from './kaleidoscope/config';
import nebulaConfig from './nebula/config';
import winterForestConfig from './winter-forest/config';
import dotGridConfig from './dot-grid/config';
import pipesConfig from './pipes/config';

const configs: Omit<BackgroundConfig, 'id'>[] = [
  { ...particlesConfig, id: '1' },
  { ...auraRingConfig, id: '2' },
  { ...horizonGlowConfig, id: '3' },
  { ...ditherStudioConfig, id: '4' },
  { ...mistConfig, id: '5' },
  { ...neonHighwayConfig, id: '6' },
  { ...asciiStudioConfig, id: '7' },
  { ...waveColumnsConfig, id: '8' },
  { ...fractalTreeConfig, id: '9' },
  { ...cyberGridConfig, id: '10' },
  { ...plasmaWaveConfig, id: '11' },
  { ...distortedRippleConfig, id: '12' },
  { ...chromaticSpiralConfig, id: '13' },
  { ...fluidLinesConfig, id: '14' },
  { ...bitmapNoiseConfig, id: '15' },
  { ...matrixConfig, id: '16' },
  { ...solarFlareConfig, id: '17' },
  { ...fireflyEffectConfig, id: '18' },
  { ...vortexTwistConfig, id: '19' },
  { ...snowFallConfig, id: '20' },
  { ...mosaicFlowConfig, id: '21' },
  { ...lunarRingConfig, id: '22' },
  { ...spiralsConfig, id: '23' },
  { ...cellularConfig, id: '24' },
  { ...noiseFieldConfig, id: '25' },
  { ...kaleidoscopeConfig, id: '26' },
  { ...nebulaConfig, id: '27' },
  { ...winterForestConfig, id: '28' },
  { ...dotGridConfig, id: '29' },
  { ...pipesConfig, id: '30' },
]

configs.forEach((config) => {
  serverRegistry.register(config as BackgroundConfig);
})
