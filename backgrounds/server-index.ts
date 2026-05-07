import { serverRegistry } from '@/lib/server-registry';
import { BackgroundConfig } from '@/lib/types';

import particlesConfig from './particles/config';
import auraRingConfig from './aura-ring/config';
import horizonGlowConfig from './horizon-glow/config';
import ditherStudioConfig from './dither-studio/config';
import mistConfig from './mist/config';
import neonHighwayConfig from './neon-highway/config';
import waveColumnsConfig from './wave-columns/config';
import halftoneStudioConfig from './halftone-studio/config';
import neuralFieldConfig from './neural-field/config';
import fractalTreeConfig from './fractal-tree/config';
import badTelevisionConfig from './bad-television/config';
import dottedSurfaceConfig from './dotted-surface/config';
import liquidWarpConfig from './liquid-warp/config';
import cyberGridConfig from './cyber-grid/config';
import distortedRippleConfig from './distorted-ripple/config';
import crtEffectConfig from './crt-effect/config';
import cosmicNoiseConfig from './cosmic-noise/config';
import chromaticSpiralConfig from './chromatic-spiral/config';
import fluidLinesConfig from './fluid-lines/config';
import bitmapNoiseConfig from './bitmap-noise/config';
import matrixConfig from './matrix/config';
import spiralsConfig from './spirals/config';
import solarFlareConfig from './solar-flare/config';
import dotGridConfig from './dot-grid/config';
import vortexTwistConfig from './vortex-twist/config';
import snowFallConfig from './snow-fall/config';
import mosaicFlowConfig from './mosaic-flow/config';
import lunarRingConfig from './lunar-ring/config';
import animalsConfig from './animals/config';
import plasmaWaveConfig from './plasma-wave/config';
import cellularConfig from './cellular/config';
import noiseFieldConfig from './noise-field/config';
import kaleidoscopeConfig from './kaleidoscope/config';
import nebulaConfig from './nebula/config';
import winterForestConfig from './winter-forest/config';
import fireflyEffectConfig from './firefly-effect/config';
import pipesConfig from './pipes/config';

const configs: BackgroundConfig[] = [
  { ...particlesConfig, id: '1' },
  { ...auraRingConfig, id: '2' },
  { ...horizonGlowConfig, id: '3' },
  { ...ditherStudioConfig, id: '4' },
  { ...mistConfig, id: '5' },
  { ...neonHighwayConfig, id: '6' },
  { ...waveColumnsConfig, id: '7' },
  { ...halftoneStudioConfig, id: '8' },
  { ...neuralFieldConfig, id: '9' },
  { ...fractalTreeConfig, id: '10' },
  { ...badTelevisionConfig, id: '11' },
  { ...dottedSurfaceConfig, id: '12' },
  { ...liquidWarpConfig, id: '13' },
  { ...cyberGridConfig, id: '14' },
  { ...distortedRippleConfig, id: '15' },
  { ...crtEffectConfig, id: '16' },
  { ...cosmicNoiseConfig, id: '17' },
  { ...chromaticSpiralConfig, id: '18' },
  { ...fluidLinesConfig, id: '19' },
  { ...bitmapNoiseConfig, id: '20' },
  { ...matrixConfig, id: '21' },
  { ...spiralsConfig, id: '22' },
  { ...solarFlareConfig, id: '23' },
  { ...dotGridConfig, id: '24' },
  { ...vortexTwistConfig, id: '25' },
  { ...snowFallConfig, id: '26' },
  { ...mosaicFlowConfig, id: '27' },
  { ...lunarRingConfig, id: '28' },
  { ...animalsConfig, id: '29' },
  { ...plasmaWaveConfig, id: '30' },
  { ...cellularConfig, id: '31' },
  { ...noiseFieldConfig, id: '32' },
  { ...kaleidoscopeConfig, id: '33' },
  { ...nebulaConfig, id: '34' },
  { ...winterForestConfig, id: '35' },
  { ...fireflyEffectConfig, id: '36' },
  { ...pipesConfig, id: '37' },
]

configs.forEach((config) => {
  serverRegistry.register(config as BackgroundConfig);
})
