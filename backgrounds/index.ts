import { registry } from '@/lib/registry';

import WaveGradient from './wave-gradient';
import waveGradientConfig from './wave-gradient/config';

registry.register({ config: waveGradientConfig, component: WaveGradient });
