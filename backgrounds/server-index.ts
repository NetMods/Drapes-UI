import { serverRegistry } from '@/lib/server-registry';
import { BackgroundConfig } from '@/lib/types';

import eyeFloatersConfig from './eye-floaters/config';
import particlesConfig from './particles/config';
import auraRingConfig from './aura-ring/config';
import horizonGlowConfig from './horizon-glow/config';
import ditherStudioConfig from './dither-studio/config';
import mistConfig from './mist/config';
import neonHighwayConfig from './neon-highway/config';
import asciiStudioConfig from './ascii-studio/config';
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
import gameOfLifeConfig from './game-of-life/config';
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
  { ...eyeFloatersConfig, id: '1' },
  { ...particlesConfig, id: '2' },
  { ...auraRingConfig, id: '3' },
  { ...horizonGlowConfig, id: '4' },
  { ...ditherStudioConfig, id: '5' },
  { ...mistConfig, id: '6' },
  { ...neonHighwayConfig, id: '7' },
  { ...asciiStudioConfig, id: '8' },
  { ...waveColumnsConfig, id: '9' },
  { ...halftoneStudioConfig, id: '10' },
  { ...neuralFieldConfig, id: '11' },
  { ...fractalTreeConfig, id: '12' },
  { ...badTelevisionConfig, id: '13' },
  { ...dottedSurfaceConfig, id: '14' },
  { ...liquidWarpConfig, id: '15' },
  { ...cyberGridConfig, id: '16' },
  { ...distortedRippleConfig, id: '17' },
  { ...crtEffectConfig, id: '18' },
  { ...cosmicNoiseConfig, id: '19' },
  { ...chromaticSpiralConfig, id: '20' },
  { ...fluidLinesConfig, id: '21' },
  { ...bitmapNoiseConfig, id: '22' },
  { ...gameOfLifeConfig, id: '23' },
  { ...matrixConfig, id: '24' },
  { ...spiralsConfig, id: '25' },
  { ...solarFlareConfig, id: '26' },
  { ...dotGridConfig, id: '27' },
  { ...vortexTwistConfig, id: '28' },
  { ...snowFallConfig, id: '29' },
  { ...mosaicFlowConfig, id: '30' },
  { ...lunarRingConfig, id: '31' },
  { ...animalsConfig, id: '32' },
  { ...plasmaWaveConfig, id: '33' },
  { ...cellularConfig, id: '34' },
  { ...noiseFieldConfig, id: '35' },
  { ...kaleidoscopeConfig, id: '36' },
  { ...nebulaConfig, id: '37' },
  { ...winterForestConfig, id: '38' },
  { ...fireflyEffectConfig, id: '39' },
  { ...pipesConfig, id: '40' },
]

configs.forEach((config) => {
  serverRegistry.register(config as BackgroundConfig);
})
