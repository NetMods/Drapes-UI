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


//import config
import waveGradientConfig from './wave-gradient/config';
import confettiConfig from './confetti/config'
import hexagonsConfig from './hexagons/config'
import festivalLightConfig from './festival-lights/config';

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
  }
]

registerEntry.forEach((entry: BackgroundEntry) => {
  registry.register(entry)
})
