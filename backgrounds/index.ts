import { registry } from '@/lib/registry';
import { BackgroundConfig } from '@/lib/types';
interface BackgroundEntry {
  config: BackgroundConfig;
  component: React.ComponentType<any>;
}

//import components
import WaveGradient from './wave-gradient';
import Confetti from './confetti'
import Hexagons from './hexagons/'
import FestivalLight from './festival-lights';
import Spirals from './spirals'
import NoiseFlow from './noise-flow'


//import config
import waveGradientConfig from './wave-gradient/config';
import confettiConfig from './confetti/config'
import hexagonsConfig from './hexagons/config'
import festivalLightConfig from './festival-lights/config';
import spiralConfig from './spirals/config'
import noiseFlowConfig from './noise-flow/config'

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
  }
]

registerEntry.forEach((entry: BackgroundEntry) => {
  registry.register(entry)
})
