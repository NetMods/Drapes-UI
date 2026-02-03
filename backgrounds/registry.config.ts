// This file controls which backgrounds are registered and in what order
// 1. Comment out or remove entries to exclude backgrounds
// 2. Add isNew: true to mark backgrounds as new

export interface RegistryEntry {
  folder: string;
  isNew?: boolean;
}

export const registryConfig: RegistryEntry[] = [
  { folder: 'particles' },
  { folder: 'distorted-ripple', isNew: true },
  { folder: 'plasma-wave' },
  { folder: 'dither-studio', isNew: true },
  { folder: 'mist' },
  { folder: 'spirals' },
  { folder: 'ascii-studio', isNew: true },
  { folder: 'fractal-tree' },
  { folder: 'fluid-lines' },
  { folder: 'matrix' },
  { folder: 'firefly-effect' },
  { folder: 'dot-grid' },
  { folder: 'noise-field' },
  { folder: 'snow-fall' },
  { folder: 'pipes' },
  // { folder: 'hexagons' },
];
