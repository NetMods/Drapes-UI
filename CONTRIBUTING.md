# Contributing Guidelines: Adding Backgrounds to Drapes

Thank you for your interest in contributing to Drapes! This guide outlines the process for adding new background components. By following these steps, you ensure seamless integration, maintainability, and compatibility with our Backgrounds.

Drapes is a collection of customizable, animated background components built with React and TypeScript. Contributions should prioritize performance, accessibility, and extensibility.

<!-- ## Prerequisites -->
<!---->
<!-- - Familiarity with React, TypeScript, and CSS (including animations). -->
<!-- - Access to the project repository. -->
<!-- - Node.js and npm/yarn for local development. -->
<!---->
<!-- Before submitting a pull request (PR), ensure your changes adhere to the [code of conduct](CODE_OF_CONDUCT.md) and pass all linting and testing checks. -->

## Step 1: Testing Your Background

Before integrating your background, validate it in a controlled environment:

1. Navigate to the `/test/` route in your local development server.
2. Implement a temporary version of your component there to verify:
   - Rendering consistency across browsers.
   - Performance (e.g., no excessive CPU/GPU usage).
   - Responsiveness on various screen sizes.
   - Interaction with controls (if applicable).

Once satisfied with the functionality and visuals, proceed to integration.

## Step 2: Creating the Background Folder

1. Create a new folder inside the `backgrounds/` directory:
   ```
   backgrounds/<component-name>/
   ```
   - This folder will contain two primary files: `index.tsx` (the component implementation) and `config.ts` (the configuration).

2. Inside the folder, add:
   - `index.tsx`: The main React component exporting your background.
   - `config.ts`: The configuration object defining metadata, props, and controls.

## Naming Conventions

- **Folder Name**: Use the **exact** name of your background component (e.g., if your component is `DotGrid`, name the folder `dot-grid` for kebab-case consistency). This is critical for automation scripts that dynamically load and register components.
- **Component Name**: PascalCase (e.g., `DotGrid`).
- **File Names**: Always `index.tsx` and `config.ts`—no variations.
- **ID in Config**: Use a unique, lowercase, hyphenated string (e.g., `dot-grid`) matching the folder name.

Adhering to these conventions prevents build errors.

## Step 3: Implementing the Component (`index.tsx`)

Your `index.tsx` should:

- Export a default React functional component.
- Accept props defined in `defaultProps` from `config.ts`.
- Use TypeScript for type safety.
- Handle animations efficiently (e.g., via CSS or Framer Motion).
- Be self-contained: Avoid external dependencies unless explicitly approved.

## Step 4: Configuring the Background (`config.ts`)

The `config.ts` file defines how your background is registered, previewed, and controlled in the Drapes library. It must export a default object conforming to the `BackgroundConfig` interface (with the `id` omitted, as it's inferred from the folder name).

### Required Interfaces

```tsx
export interface BackgroundConfig {
  id: string; // Omitted in export; auto-generated from folder name
  name: string;
  description: string;
  author?: string;
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
  type: 'slider' | 'color' | 'select' | 'toggle';
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For 'select' type
  defaultValue: any;
  description?: string;
}
```

### Guidelines for `config.ts`

- **name**: A concise, human-readable title (e.g., "Dot Grid").
- **description**: A brief overview of the background's purpose and features (1-2 sentences).
- **author**: Your name or handle (optional).
- **tags**: An array of relevant keywords for categorization (e.g., `['animated', 'grids', 'abstract']`).
- **defaultProps**: An object with initial values for all customizable props.
- **controls**: An array of interactive controls for the preview panel. Match keys to props in your component.
- **code**: Pre-generated code snippets for usage examples. Import these from a `./code` file or generate them inline. Include both JSX/TSX and HTML-wrapped variants for flexibility.

Export the config as `Omit<BackgroundConfig, 'id'>` to exclude the auto-generated `id`.

### Sample Configuration

Here's a complete example for a "Dot Grid" background:

```tsx
import { BackgroundConfig } from '@/lib/types';
import { jsxCode, tsxCode, tsxCodeHTML, jsxCodeHTML, usageCodeHTML, usageCode } from './code';

export default {
  name: 'Dot Grid',
  description: 'Smooth animated dot grids with scalable, glowing effects for dynamic visuals.',
  author: 'NetMods',
  tags: ['animated', 'dotted-grids', 'waves'],
  defaultProps: {
    dotSpacing: 30,
    dotBaseSize: 2,
    influenceRadius: 150,
    maxScale: 8,
    backgroundColor: '#0a0a0a',
    glowColor: '#8b5cf6',
    numLayers: 2,
  },
  code: {
    usage: usageCodeHTML,
    rawUsage: usageCode,
    tsx: tsxCodeHTML,
    jsx: jsxCodeHTML,
    rawjsx: jsxCode,
    rawtsx: tsxCode,
  },
  controls: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#0a0a0a',
      description: 'The base background color.',
    },
    {
      key: 'glowColor',
      label: 'Glow Color',
      type: 'color',
      defaultValue: '#8b5cf6',
      description: 'Color for scaled, glowing dots.',
    },
    {
      key: 'dotSpacing',
      label: 'Dot Spacing',
      type: 'slider',
      min: 20,
      max: 50,
      step: 10,
      defaultValue: 30,
    },
    {
      key: 'dotBaseSize',
      label: 'Dot Size',
      type: 'slider',
      min: 0.5,
      max: 5,
      step: 0.1,
      defaultValue: 2,
    },
    {
      key: 'maxScale',
      label: 'Scaled Dots Size',
      type: 'slider',
      min: 0,
      max: 20,
      step: 2,
      defaultValue: 8,
    },
    {
      key: 'influenceRadius',
      label: 'Influence Radius',
      type: 'slider',
      min: 0,
      max: 400,
      step: 10,
      defaultValue: 150,
    },
    {
      key: 'numLayers',
      label: 'Number of Layers',
      type: 'slider',
      min: 0,
      max: 10,
      step: 1,
      defaultValue: 2,
    },
  ],
} as Omit<BackgroundConfig, 'id'>;
```

For code snippets, the `./code.ts` file will be crated for run just run.
```
pnpm dev
```

## Step 5: Registering the Background in `backgrounds/index.ts`

To make your background discoverable by the application, add an import statement in the root `backgrounds/index.ts` file. This ensures it's included in the exported backgrounds registry.

1. Open `backgrounds/index.ts`.
2. Add the import in the same respective order as existing imports.
3. Example import:
```tsx
   ...
   import DotGrid from './dot-grid';

   ...
   import dotGridConfig from './dot-grid/config';
```


This step is essential for runtime loading and prevents the component from being excluded from builds.

## Step 6: Submitting Your Contribution

1. **Commit and Push**:
   - Use descriptive commit messages (e.g., `feat: add dot-grid animated background`).
   - Branch from `master` (e.g., `feature/dot-grid-background`).

2. **Pull Request**:
   - Open a PR against the `master` branch.
   - Include:
     - A demo screenshot or GIF.
   - Ensure the PR passes automated checks (linting, TypeScript, tests).

3. **Review Process**:
   - Expect feedback from maintainers.
   - Address all comments iteratively.

## Best Practices

- **Performance**: Optimize for 60fps animations; use `requestAnimationFrame` where possible.
- **Accessibility**: Ensure backgrounds don't interfere with text readability (e.g., provide contrast options).
- **Documentation**: Update `README.md` if your contribution warrants it.
- **Testing**: Add unit tests in `backgrounds/<component-name>/__tests__/`.

If you encounter issues, join our [community discussion](https://github.com/your-org/drapes/discussions) or file an issue.

We appreciate your contributions—let's make Drapes even more vibrant! 🎨
