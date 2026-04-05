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
import backgroundTreeConfig from './background-tree/config';
import winterForestConfig from './winter-forest/config';
import fireflyEffectConfig from './firefly-effect/config';
import pipesConfig from './pipes/config';
import eyeFloatersConfig from './eye-floaters/config';
import orbitalConfig from './orbital/config';
import threeBodyConfig from './three-body/config';

const configs: BackgroundConfig[] = [
  { ...particlesConfig, id: '1' },
  { ...auraRingConfig, id: '2' },
  { ...horizonGlowConfig, id: '3' },
  { ...ditherStudioConfig, id: '4' },
  { ...mistConfig, id: '5' },
  { ...neonHighwayConfig, id: '6' },
  { ...asciiStudioConfig, id: '7' },
  { ...waveColumnsConfig, id: '8' },
  { ...halftoneStudioConfig, id: '9' },
  { ...neuralFieldConfig, id: '10' },
  { ...fractalTreeConfig, id: '11' },
  { ...badTelevisionConfig, id: '12' },
  { ...dottedSurfaceConfig, id: '13' },
  { ...liquidWarpConfig, id: '14' },
  { ...cyberGridConfig, id: '15' },
  { ...distortedRippleConfig, id: '16' },
  { ...crtEffectConfig, id: '17' },
  { ...cosmicNoiseConfig, id: '18' },
  { ...chromaticSpiralConfig, id: '19' },
  { ...fluidLinesConfig, id: '20' },
  { ...bitmapNoiseConfig, id: '21' },
  { ...gameOfLifeConfig, id: '22' },
  { ...matrixConfig, id: '23' },
  { ...spiralsConfig, id: '24' },
  { ...solarFlareConfig, id: '25' },
  { ...dotGridConfig, id: '26' },
  { ...vortexTwistConfig, id: '27' },
  { ...snowFallConfig, id: '28' },
  { ...mosaicFlowConfig, id: '29' },
  { ...lunarRingConfig, id: '30' },
  { ...animalsConfig, id: '31' },
  { ...plasmaWaveConfig, id: '32' },
  { ...cellularConfig, id: '33' },
  { ...noiseFieldConfig, id: '34' },
  { ...kaleidoscopeConfig, id: '35' },
  { ...nebulaConfig, id: '36' },
  { ...backgroundTreeConfig, id: '37' },
  { ...winterForestConfig, id: '38' },
  { ...fireflyEffectConfig, id: '39' },
  { ...pipesConfig, id: '40' },
  { ...eyeFloatersConfig, id: '41' },
  { ...orbitalConfig, id: '42' },
  { ...threeBodyConfig, id: '43' },
]

configs.forEach((config) => {
  serverRegistry.register(config as BackgroundConfig);
})
