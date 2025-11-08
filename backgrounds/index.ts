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


//import config
import waveGradientConfig from './wave-gradient/config';
import confettiConfig from './confetti/config'
import hexagonsConfig from './hexagons/config'

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
  }
]

registerEntry.forEach((entry: BackgroundEntry) => {
  registry.register(entry)
})
