export interface BackgroundConfig {
  id?: string;
  name: string;
  description: string;
  author: {
    name: string
    imageUrl: string;
    redirectUrl: string;
  }

  tags: string[];
  defaultProps: Record<string, any>;
  controls: Control[];

  code: {
    usage: string;
    rawUsage: string;
    jsx: string;
    tsx: string;
    rawjsx: string;
    rawtsx: string;
  };
}

export interface Control {
  key: string;
  label: string;
  type: 'slider' | 'color' | 'select' | 'toggle' | 'media-input' | 'text-input' | 'download';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: any;
  description?: string;
  placeholder?: string;
  maxLength?: number;
  mediaTypeKey?: string;
  defaultImage?: string;
  defaultVideo?: string;
  downloadUrlKey?: string;
  downloadUrls?: Record<string, string>;
}


export interface BackgroundEntry {
  config: BackgroundConfig;
  component: React.ComponentType<any>;
  isNew?: boolean;
}

