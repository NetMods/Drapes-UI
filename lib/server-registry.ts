import { BackgroundConfig } from './types';

class ServerBackgroundRegistry {
  private backgrounds: Map<string, BackgroundConfig> = new Map();

  register(config: BackgroundConfig) {
    this.backgrounds.set(String(config.id), config);
  }

  get(id: string): BackgroundConfig | undefined {
    return this.backgrounds.get(id);
  }

  getAll(): BackgroundConfig[] {
    return Array.from(this.backgrounds.values());
  }

  getSize(): number {
    return this.backgrounds.size;
  }
}

export const serverRegistry = new ServerBackgroundRegistry();
