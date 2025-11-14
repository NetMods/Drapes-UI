import { BackgroundConfig } from './types';

export interface BackgroundEntry {
  config: BackgroundConfig;
  component: React.ComponentType<any>;
}

class BackgroundRegistry {
  private backgrounds: Map<string, BackgroundEntry> = new Map();

  register(entry: BackgroundEntry) {
    this.backgrounds.set(String(entry.config.id), entry);
  }

  get(id: string): BackgroundEntry | undefined {
    return this.backgrounds.get(id);
  }

  getAll(): BackgroundEntry[] {
    return Array.from(this.backgrounds.values());
  }

  getSize(): Number {
    return this.backgrounds.size
  }
}

export const registry = new BackgroundRegistry();
