import { serverRegistry } from '@/lib/server-registry';
import { BackgroundConfig } from '@/lib/types';

import animalsConfig from './animals/config';
import kineticDistortionConfig from './kinetic-distortion/config';
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
import matrixConfig from './matrix/config';
import spiralsConfig from './spirals/config';
import solarFlareConfig from './solar-flare/config';
import dotGridConfig from './dot-grid/config';
import vortexTwistConfig from './vortex-twist/config';
import snowFallConfig from './snow-fall/config';
import mosaicFlowConfig from './mosaic-flow/config';
import lunarRingConfig from './lunar-ring/config';
import plasmaWaveConfig from './plasma-wave/config';
import cellularConfig from './cellular/config';
import noiseFieldConfig from './noise-field/config';
import kaleidoscopeConfig from './kaleidoscope/config';
import nebulaConfig from './nebula/config';
import winterForestConfig from './winter-forest/config';
import fireflyEffectConfig from './firefly-effect/config';
import pipesConfig from './pipes/config';

const configs: BackgroundConfig[] = [
  { ...animalsConfig, id: '1' },
  { ...kineticDistortionConfig, id: '2' },
  { ...particlesConfig, id: '3' },
  { ...auraRingConfig, id: '4' },
  { ...horizonGlowConfig, id: '5' },
  { ...ditherStudioConfig, id: '6' },
  { ...mistConfig, id: '7' },
  { ...neonHighwayConfig, id: '8' },
  { ...asciiStudioConfig, id: '9' },
  { ...waveColumnsConfig, id: '10' },
  { ...halftoneStudioConfig, id: '11' },
  { ...neuralFieldConfig, id: '12' },
  { ...fractalTreeConfig, id: '13' },
  { ...badTelevisionConfig, id: '14' },
  { ...dottedSurfaceConfig, id: '15' },
  { ...liquidWarpConfig, id: '16' },
  { ...cyberGridConfig, id: '17' },
  { ...distortedRippleConfig, id: '18' },
  { ...crtEffectConfig, id: '19' },
  { ...cosmicNoiseConfig, id: '20' },
  { ...chromaticSpiralConfig, id: '21' },
  { ...fluidLinesConfig, id: '22' },
  { ...bitmapNoiseConfig, id: '23' },
  { ...matrixConfig, id: '24' },
  { ...spiralsConfig, id: '25' },
  { ...solarFlareConfig, id: '26' },
  { ...dotGridConfig, id: '27' },
  { ...vortexTwistConfig, id: '28' },
  { ...snowFallConfig, id: '29' },
  { ...mosaicFlowConfig, id: '30' },
  { ...lunarRingConfig, id: '31' },
  { ...plasmaWaveConfig, id: '32' },
  { ...cellularConfig, id: '33' },
  { ...noiseFieldConfig, id: '34' },
  { ...kaleidoscopeConfig, id: '35' },
  { ...nebulaConfig, id: '36' },
  { ...winterForestConfig, id: '37' },
  { ...fireflyEffectConfig, id: '38' },
  { ...pipesConfig, id: '39' },
]

configs.forEach((config) => {
  serverRegistry.register(config as BackgroundConfig);
})
