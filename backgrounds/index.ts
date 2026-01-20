import { registry } from '@/lib/registry';
import { BackgroundConfig, BackgroundEntry } from '@/lib/types';

//import components
import Particles from './particles'
import DistortedRipple from './distorted-ripple'
import PlasmaWave from './plasma-wave'
import DitherStudio from './dither-studio'
import Mist from './mist'
import Spirals from './spirals'
import FractalTree from './fractal-tree'
import FluidLines from './fluid-lines'
import Matrix from './matrix'
import FireflyEffect from './firefly-effect'
import DotGrid from './dot-grid'
import NoiseField from './noise-field'
import SnowFall from './snow-fall'
import Pipes from './pipes'

//import config
import particlesConfig from './particles/config';
import distortedRippleConfig from './distorted-ripple/config';
import plasmaWaveConfig from './plasma-wave/config';
import ditherStudioConfig from './dither-studio/config';
import mistConfig from './mist/config';
import spiralsConfig from './spirals/config';
import fractalTreeConfig from './fractal-tree/config';
import fluidLinesConfig from './fluid-lines/config';
import matrixConfig from './matrix/config';
import fireflyEffectConfig from './firefly-effect/config';
import dotGridConfig from './dot-grid/config';
import noiseFieldConfig from './noise-field/config';
import snowFallConfig from './snow-fall/config';
import pipesConfig from './pipes/config';

const registerEntry: BackgroundEntry[] = [
  { config: particlesConfig, component: Particles },
  { config: distortedRippleConfig, component: DistortedRipple, isNew: true },
  { config: plasmaWaveConfig, component: PlasmaWave },
  { config: ditherStudioConfig, component: DitherStudio, isNew: true },
  { config: mistConfig, component: Mist },
  { config: spiralsConfig, component: Spirals },
  { config: fractalTreeConfig, component: FractalTree },
  { config: fluidLinesConfig, component: FluidLines },
  { config: matrixConfig, component: Matrix },
  { config: fireflyEffectConfig, component: FireflyEffect },
  { config: dotGridConfig, component: DotGrid },
  { config: noiseFieldConfig, component: NoiseField },
  { config: snowFallConfig, component: SnowFall },
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
