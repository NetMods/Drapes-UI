import { registry } from '@/lib/registry';
import { BackgroundConfig, BackgroundEntry } from '@/lib/types';

//import components
import WaveGradient from './dot-grid'
import Particles from './particles'
import Hexagons from './hexagons/'
import Spirals from './spirals'
import NoiseFlow from './noise-field'
import Snowfall from './snow-fall'
import Pipes from './pipes'
import Matrix from './matrix'
import PlasmaWave from './plasma-wave';
import FractalTree from './fractal-tree';
import FluidLines from './fluid-lines';
import Mist from './mist';
import FireFly from './firefly-effect';

//import config
import dotGridConfig from './dot-grid/config';
import particlesConfig from './particles/config'
import hexagonsConfig from './hexagons/config'
import spiralConfig from './spirals/config'
import noiseFlowConfig from './noise-field/config';
import snowfallConfig from './snow-fall/config';
import pipesConfig from './pipes/config';
import matrixConfig from './matrix/config';
import plasmaWaveConfig from './plasma-wave/config';
import mistConfig from './mist/config'
import fluidLinesConfig from './fluid-lines/config';
import fractalTreeConfig from './fractal-tree/config';
import fireflyConfig from './firefly-effect/config';


const registerEntry: BackgroundEntry[] = [
  { config: noiseFlowConfig, component: NoiseFlow },
  { config: fluidLinesConfig, component: FluidLines },
  { config: dotGridConfig, component: WaveGradient },
  { config: particlesConfig, component: Particles },
  { config: mistConfig, component: Mist, isNew: true },
  { config: spiralConfig, component: Spirals },
  { config: fractalTreeConfig, component: FractalTree },
  { config: fireflyConfig, component: FireFly, isNew: true },
  { config: snowfallConfig, component: Snowfall },
  { config: pipesConfig, component: Pipes },
  { config: matrixConfig, component: Matrix },
  { config: plasmaWaveConfig, component: PlasmaWave },
  // { config: hexagonsConfig, component: Hexagons },
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
