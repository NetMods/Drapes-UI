import { registry } from '@/lib/registry';
import { BackgroundConfig } from '@/lib/types';

interface BackgroundEntry {
  config: Omit<BackgroundConfig, 'id'>;
  component: React.ComponentType<any>;
}

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

//import config
import dotGridConfig from './dot-grid/config';
import particlesConfig from './particles/config'
import hexagonsConfig from './hexagons/config'
import spiralConfig from './spirals/config'
import noiseFlowConfig from './noise-field/config'
import snowfallConfig from './snow-fall/config'
import pipesConfig from './pipes/config'
import matrixConfig from './matrix/config'
import plasmaWaveConfig from './plasma-wave/config';

const registerEntry: BackgroundEntry[] = [
  { config: noiseFlowConfig, component: NoiseFlow },
  { config: snowfallConfig, component: Snowfall },
  { config: dotGridConfig, component: WaveGradient },
  { config: hexagonsConfig, component: Hexagons },
  { config: plasmaWaveConfig, component: PlasmaWave },
  { config: spiralConfig, component: Spirals },
  { config: particlesConfig, component: Particles },
  { config: pipesConfig, component: Pipes },
  { config: matrixConfig, component: Matrix },
]

registerEntry.forEach((entry: BackgroundEntry, index) => {
  const id = String(index + 1);

  const configWithId: BackgroundConfig = { ...entry.config, id };

  registry.register({
    config: configWithId,
    component: entry.component,
  });
})
