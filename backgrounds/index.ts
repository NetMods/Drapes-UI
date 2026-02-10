import { registry } from '@/lib/registry';
import { BackgroundConfig, BackgroundEntry } from '@/lib/types';

//import components
import Particles from './particles'
import AuraRing from './aura-ring'
import HorizonGlow from './horizon-glow'
import DitherStudio from './dither-studio'
import Mist from './mist'
import NeonHighway from './neon-highway'
import AsciiStudio from './ascii-studio'
import WaveColumns from './wave-columns'
import HalftoneStudio from './halftone-studio'
import NeuralField from './neural-field'
import FractalTree from './fractal-tree'
import BadTelevision from './bad-television'
import DottedSurface from './dotted-surface'
import LiquidWarp from './liquid-warp'
import CyberGrid from './cyber-grid'
import DistortedRipple from './distorted-ripple'
import CosmicNoise from './cosmic-noise'
import ChromaticSpiral from './chromatic-spiral'
import FluidLines from './fluid-lines'
import BitmapNoise from './bitmap-noise'
import Matrix from './matrix'
import PlasmaWave from './plasma-wave'
import SolarFlare from './solar-flare'
import DotGrid from './dot-grid'
import VortexTwist from './vortex-twist'
import SnowFall from './snow-fall'
import MosaicFlow from './mosaic-flow'
import LunarRing from './lunar-ring'
import Spirals from './spirals'
import Cellular from './cellular'
import NoiseField from './noise-field'
import Kaleidoscope from './kaleidoscope'
import Nebula from './nebula'
import WinterForest from './winter-forest'
import FireflyEffect from './firefly-effect'
import Pipes from './pipes'

//import config
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
import cosmicNoiseConfig from './cosmic-noise/config';
import chromaticSpiralConfig from './chromatic-spiral/config';
import fluidLinesConfig from './fluid-lines/config';
import bitmapNoiseConfig from './bitmap-noise/config';
import matrixConfig from './matrix/config';
import plasmaWaveConfig from './plasma-wave/config';
import solarFlareConfig from './solar-flare/config';
import dotGridConfig from './dot-grid/config';
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
import fireflyEffectConfig from './firefly-effect/config';
import pipesConfig from './pipes/config';

const registerEntry: BackgroundEntry[] = [
  { config: particlesConfig, component: Particles },
  { config: auraRingConfig, component: AuraRing, isNew: true },
  { config: horizonGlowConfig, component: HorizonGlow, isNew: true },
  { config: ditherStudioConfig, component: DitherStudio },
  { config: mistConfig, component: Mist },
  { config: neonHighwayConfig, component: NeonHighway },
  { config: asciiStudioConfig, component: AsciiStudio, isNew: true },
  { config: waveColumnsConfig, component: WaveColumns },
  { config: halftoneStudioConfig, component: HalftoneStudio, isNew: true },
  { config: neuralFieldConfig, component: NeuralField },
  { config: fractalTreeConfig, component: FractalTree },
  { config: badTelevisionConfig, component: BadTelevision, isNew: true },
  { config: dottedSurfaceConfig, component: DottedSurface },
  { config: liquidWarpConfig, component: LiquidWarp },
  { config: cyberGridConfig, component: CyberGrid },
  { config: distortedRippleConfig, component: DistortedRipple },
  { config: cosmicNoiseConfig, component: CosmicNoise },
  { config: chromaticSpiralConfig, component: ChromaticSpiral },
  { config: fluidLinesConfig, component: FluidLines },
  { config: bitmapNoiseConfig, component: BitmapNoise },
  { config: matrixConfig, component: Matrix },
  { config: plasmaWaveConfig, component: PlasmaWave },
  { config: solarFlareConfig, component: SolarFlare },
  { config: dotGridConfig, component: DotGrid },
  { config: vortexTwistConfig, component: VortexTwist },
  { config: snowFallConfig, component: SnowFall },
  { config: mosaicFlowConfig, component: MosaicFlow },
  { config: lunarRingConfig, component: LunarRing },
  { config: spiralsConfig, component: Spirals },
  { config: cellularConfig, component: Cellular },
  { config: noiseFieldConfig, component: NoiseField },
  { config: kaleidoscopeConfig, component: Kaleidoscope },
  { config: nebulaConfig, component: Nebula },
  { config: winterForestConfig, component: WinterForest },
  { config: fireflyEffectConfig, component: FireflyEffect },
  { config: pipesConfig, component: Pipes },
]

registerEntry.forEach((entry: BackgroundEntry, index) => {
  const id = String(index + 1);

  const configWithId: BackgroundConfig = { ...entry.config, id };

  registry.register({
    config: configWithId,
    component: entry.component,
    isNew: entry.isNew,
  });
})
