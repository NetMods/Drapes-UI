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
import FractalTree from './fractal-tree'
import CyberGrid from './cyber-grid'
import PlasmaWave from './plasma-wave'
import HalftoneStudio from './halftone-studio'
import DistortedRipple from './distorted-ripple'
import ChromaticSpiral from './chromatic-spiral'
import FluidLines from './fluid-lines'
import BitmapNoise from './bitmap-noise'
import Matrix from './matrix'
import SolarFlare from './solar-flare'
import FireflyEffect from './firefly-effect'
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
import DotGrid from './dot-grid'
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
import fractalTreeConfig from './fractal-tree/config';
import cyberGridConfig from './cyber-grid/config';
import plasmaWaveConfig from './plasma-wave/config';
import halftoneStudioConfig from './halftone-studio/config';
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

const registerEntry: BackgroundEntry[] = [
  { config: particlesConfig, component: Particles },
  { config: auraRingConfig, component: AuraRing, isNew: true },
  { config: horizonGlowConfig, component: HorizonGlow, isNew: true },
  { config: ditherStudioConfig, component: DitherStudio },
  { config: mistConfig, component: Mist },
  { config: neonHighwayConfig, component: NeonHighway, isNew: true },
  { config: asciiStudioConfig, component: AsciiStudio, isNew: true },
  { config: waveColumnsConfig, component: WaveColumns, isNew: true },
  { config: fractalTreeConfig, component: FractalTree },
  { config: cyberGridConfig, component: CyberGrid, isNew: true },
  { config: plasmaWaveConfig, component: PlasmaWave },
  { config: halftoneStudioConfig, component: HalftoneStudio, isNew: true },
  { config: distortedRippleConfig, component: DistortedRipple },
  { config: chromaticSpiralConfig, component: ChromaticSpiral, isNew: true },
  { config: fluidLinesConfig, component: FluidLines },
  { config: bitmapNoiseConfig, component: BitmapNoise, isNew: true },
  { config: matrixConfig, component: Matrix },
  { config: solarFlareConfig, component: SolarFlare, isNew: true },
  { config: fireflyEffectConfig, component: FireflyEffect },
  { config: vortexTwistConfig, component: VortexTwist, isNew: true },
  { config: snowFallConfig, component: SnowFall },
  { config: mosaicFlowConfig, component: MosaicFlow, isNew: true },
  { config: lunarRingConfig, component: LunarRing, isNew: true },
  { config: spiralsConfig, component: Spirals },
  { config: cellularConfig, component: Cellular, isNew: true },
  { config: noiseFieldConfig, component: NoiseField },
  { config: kaleidoscopeConfig, component: Kaleidoscope, isNew: true },
  { config: nebulaConfig, component: Nebula, isNew: true },
  { config: winterForestConfig, component: WinterForest, isNew: true },
  { config: dotGridConfig, component: DotGrid },
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
