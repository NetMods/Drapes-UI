export interface BackgroundConfig {
  id: string;
  name: string;
  description: string;
  author?: string;
  tags: string[];
  thumbnail?: string;

  defaultProps: Record<string, any>;

  controls: Control[];

  code: {
    usage: string;
    jsx: string;
    tsx: string;
  };
}

export interface Control {
  key: string;
  label: string;
  type: 'slider' | 'color' | 'select' | 'toggle';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: any;
  description?: string;
}
