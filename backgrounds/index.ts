import { registry } from '@/lib/registry';
import { BackgroundConfig, BackgroundEntry } from '@/lib/types';

//import components
import Particles from './particles'
import AuraRing from './aura-ring'
import PlasmaWave from './plasma-wave'
import DitherStudio from './dither-studio'
import Mist from './mist'
import Spirals from './spirals'
import AsciiStudio from './ascii-studio'
import FractalTree from './fractal-tree'
import DistortedRipple from './distorted-ripple'
import FluidLines from './fluid-lines'
import BitmapNoise from './bitmap-noise'
import Matrix from './matrix'
import FireflyEffect from './firefly-effect'
import DotGrid from './dot-grid'
import NoiseField from './noise-field'
import SnowFall from './snow-fall'
import Pipes from './pipes'
import HorizonGlow from './horizon-glow'
import LunarRing from './lunar-ring'
import Cellular from './cellular'
import MosaicFlow from './mosaic-flow'
import ChromaticSpiral from './chromatic-spiral'
import WaveColumns from './wave-columns'
import SolarFlare from './solar-flare'
import CyberGrid from './cyber-grid'
import Nebula from './nebula'
import WinterForest from './winter-forest'
import VortexTwist from './vortex-twist'
import NeonHighway from './neon-highway'
import Kaleidoscope from './kaleidoscope'

//import config
import particlesConfig from './particles/config';
import auraRingConfig from './aura-ring/config';
import plasmaWaveConfig from './plasma-wave/config';
import ditherStudioConfig from './dither-studio/config';
import mistConfig from './mist/config';
import spiralsConfig from './spirals/config';
import asciiStudioConfig from './ascii-studio/config';
import fractalTreeConfig from './fractal-tree/config';
import distortedRippleConfig from './distorted-ripple/config';
import fluidLinesConfig from './fluid-lines/config';
import bitmapNoiseConfig from './bitmap-noise/config';
import matrixConfig from './matrix/config';
import fireflyEffectConfig from './firefly-effect/config';
import dotGridConfig from './dot-grid/config';
import noiseFieldConfig from './noise-field/config';
import snowFallConfig from './snow-fall/config';
import pipesConfig from './pipes/config';
import horizonGlowConfig from './horizon-glow/config';
import lunarRingConfig from './lunar-ring/config';
import cellularConfig from './cellular/config';
import mosaicFlowConfig from './mosaic-flow/config';
import chromaticSpiralConfig from './chromatic-spiral/config';
import waveColumnsConfig from './wave-columns/config';
import solarFlareConfig from './solar-flare/config';
import cyberGridConfig from './cyber-grid/config';
import nebulaConfig from './nebula/config';
import winterForestConfig from './winter-forest/config';
import vortexTwistConfig from './vortex-twist/config';
import neonHighwayConfig from './neon-highway/config';
import kaleidoscopeConfig from './kaleidoscope/config';

const registerEntry: BackgroundEntry[] = [
  { config: particlesConfig, component: Particles },
  { config: auraRingConfig, component: AuraRing, isNew: true },
  { config: plasmaWaveConfig, component: PlasmaWave },
  { config: ditherStudioConfig, component: DitherStudio },
  { config: mistConfig, component: Mist },
  { config: spiralsConfig, component: Spirals },
  { config: asciiStudioConfig, component: AsciiStudio, isNew: true },
  { config: fractalTreeConfig, component: FractalTree },
  { config: distortedRippleConfig, component: DistortedRipple },
  { config: fluidLinesConfig, component: FluidLines },
  { config: bitmapNoiseConfig, component: BitmapNoise, isNew: true },
  { config: matrixConfig, component: Matrix },
  { config: fireflyEffectConfig, component: FireflyEffect },
  { config: dotGridConfig, component: DotGrid },
  { config: noiseFieldConfig, component: NoiseField },
  { config: snowFallConfig, component: SnowFall },
  { config: pipesConfig, component: Pipes },
  { config: horizonGlowConfig, component: HorizonGlow, isNew: true },
  { config: lunarRingConfig, component: LunarRing, isNew: true },
  { config: cellularConfig, component: Cellular, isNew: true },
  { config: mosaicFlowConfig, component: MosaicFlow, isNew: true },
  { config: chromaticSpiralConfig, component: ChromaticSpiral, isNew: true },
  { config: waveColumnsConfig, component: WaveColumns, isNew: true },
  { config: solarFlareConfig, component: SolarFlare, isNew: true },
  { config: cyberGridConfig, component: CyberGrid, isNew: true },
  { config: nebulaConfig, component: Nebula, isNew: true },
  { config: winterForestConfig, component: WinterForest, isNew: true },
  { config: vortexTwistConfig, component: VortexTwist, isNew: true },
  { config: neonHighwayConfig, component: NeonHighway, isNew: true },
  { config: kaleidoscopeConfig, component: Kaleidoscope, isNew: true },
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
