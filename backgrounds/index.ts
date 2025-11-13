import { registry } from '@/lib/registry';
import { BackgroundConfig } from '@/lib/types';

interface BackgroundEntry {
  config: BackgroundConfig;
  component: React.ComponentType<any>;
}

//import components
import WaveGradient from './dot-grid'
import Confetti from './particles'
import Hexagons from './hexagons/'
import FestivalLights from './festival-lights';
import Spirals from './spirals'
import NoiseFlow from './noise-field'
import Snowfall from './snow-fall'
import Pipes from './pipes'
import Matrix from './matrix'

//import config
import dotGridConfig from './dot-grid/config';
import confettiConfig from './particles/config'
import hexagonsConfig from './hexagons/config'
import festivalLightConfig from './festival-lights/config';
import spiralConfig from './spirals/config'
import noiseFlowConfig from './noise-field/config'
import snowfallConfig from './snow-fall/config'
import pipesConfig from './pipes/config'
import matrixConfig from './matrix/config'

const registerEntry: BackgroundEntry[] = [
  {
    config: dotGridConfig,
    component: WaveGradient
  },
  {
    config: noiseFlowConfig,
    component: NoiseFlow
  },
  {
    config: snowfallConfig,
    component: Snowfall
  },
  {
    config: hexagonsConfig,
    component: Hexagons
  },
  {
    config: confettiConfig,
    component: Confetti
  },
  {
    config: festivalLightConfig,
    component: FestivalLights
  },
  {
    config: spiralConfig,
    component: Spirals
  },
  {
    config: matrixConfig,
    component: Matrix
  },
  {
    config: pipesConfig,
    component: Pipes
  },
]

registerEntry.forEach((entry: BackgroundEntry) => {
  registry.register(entry)
})
