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
import FestivalLight from './festival-lights';
import Spirals from './spirals'
import NoiseFlow from './noise-flow'
import Snowfall from './snowfall'
import Pipes from './pipes'
import Matrix from './matrix'


//import config
import waveGradientConfig from './dot-grid//config';
import confettiConfig from './particles//config'
import hexagonsConfig from './hexagons/config'
import festivalLightConfig from './festival-lights/config';
import spiralConfig from './spirals/config'
import noiseFlowConfig from './noise-flow/config'
import snowfallConfig from './snowfall/config'
import pipesConfig from './pipes/config'
import matrixConfig from './matrix/config'

const registerEntry: BackgroundEntry[] = [
  {
    config: waveGradientConfig,
    component: WaveGradient
  },
  {
    config: confettiConfig,
    component: Confetti
  },
  {
    config: hexagonsConfig,
    component: Hexagons
  },
  {
    config: festivalLightConfig,
    component: FestivalLight
  },
  {
    config: spiralConfig,
    component: Spirals
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
    config: pipesConfig,
    component: Pipes
  },
  {
    config: matrixConfig,
    component: Matrix
  }
]

registerEntry.forEach((entry: BackgroundEntry) => {
  registry.register(entry)
})
