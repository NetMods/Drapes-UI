import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

export function generateUsageCode(
  componentName: string,
  defaultProps: Record<string, any>
): string {
  const propsString = Object.entries(defaultProps)
    .map(([key, value]) => {
      const propValue = typeof value === 'string' ? `"${value}"` : value;
      return `        ${key}={${propValue}}`;
    })
    .join('\n');

  return `import ${componentName} from '@/components/ui/background';

export default function MyPage() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <${componentName}
${propsString}
      />
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Your content here */}
      </div>
    </div>
  );
}`;
}

export function convertTsToJs(tsCode: string): string {
  return tsCode
    // Remove interface definitions
    .replace(/interface\s+\w+\s*{[^}]*}/g, '')
    // Remove type annotations from props
    .replace(/:\s*React\.FC<\w+>/g, '')
    .replace(/:\s*React\.ComponentType<\w+>/g, '')
    // Remove type annotations from variables and parameters
    .replace(/:\s*(\w+(\[\])?|\w+<[^>]+>)/g, '')
    // Remove HTMLElement types
    .replace(/:\s*HTML\w+Element(\s*\|\s*null)?/g, '')
    // Remove type imports
    .replace(/import\s+(?:type\s+)?{[^}]*}\s+from\s+['"][^'"]+['"];?\s*/g, (match) => {
      // Keep React imports
      if (match.includes('from \'react\'') || match.includes('from "react"')) {
        return match.replace(/type\s+/g, '').replace(/:\s*\w+/g, '');
      }
      return '';
    })
    // Remove generic type parameters
    .replace(/<([^>]+)>/g, '')
    // Clean up multiple empty lines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

const backgrounds = glob.sync('backgrounds/*/index.tsx');

backgrounds.forEach(file => {
  console.log(`\n- Processing file: ${file}`);

  let tsxCode: string = "";
  try {
    tsxCode += readFileSync(file, 'utf-8');
    console.log(`✓ Read TSX file (${tsxCode.trim().split('\n').length} lines)`);
  } catch (err) {
    console.error(`✗ Failed to read TSX file: ${file}`, err);
    return;
  }

  let jsxCode: string = "";
  try {
    jsxCode += convertTsToJs(tsxCode);
    console.log(`✓ Converted TSX → JSX`);
  } catch (err) {
    console.error(`✗ Failed to convert TSX to JSX for: ${file}`, err);
    return;
  }

  const dir = file.replace('/index.tsx', '');
  const folderName = dir.split('/').pop() || '';
  const componentName = kebabToPascal(folderName);
  console.log(`✓ Component Name: ${componentName}`);

  const configPath = join(dir, 'config.ts');
  let usageCode = '';

  if (!existsSync(configPath)) {
    console.warn(`⚠️ Config file not found: ${configPath}`);
  } else {
    let configContent: string;
    try {
      configContent = readFileSync(configPath, 'utf-8');
    } catch (err) {
      console.error(`✗ Failed to read config: ${configPath}`, err);
      writeOutput(dir, tsxCode, jsxCode, usageCode);
      return;
    }

    // Match default export
    const exportMatch = configContent.match(/export\s+default\s+([\s\S]*?)(?:as\s+\w+)?\s*;?\s*$/);
    if (!exportMatch) {
      console.warn(`✗ No default export found in config: ${configPath}`);
      writeOutput(dir, tsxCode, jsxCode, usageCode);
      return;
    }

    let objectStr = exportMatch[1].trim();
    objectStr = objectStr.replace(/\s+as\s+\w+\s*$/, '').trim();

    // Extract defaultProps
    const defaultPropsMatch = objectStr.match(/defaultProps\s*:\s*({[\s\S]*?})\s*,/);
    if (!defaultPropsMatch) {
      console.warn(`✗ No 'defaultProps' found in exported object`);
      writeOutput(dir, tsxCode, jsxCode, usageCode);
      return;
    }

    const defaultPropsStr = defaultPropsMatch[1];

    let defaultProps: any;
    try {
      defaultProps = new Function(`return ${defaultPropsStr}`)();
      console.error(`✓ Found default props`);
    } catch (err) {
      console.error(`✗ Failed to parse defaultProps with Function constructor:`, err);
      writeOutput(dir, tsxCode, jsxCode, usageCode);
      return;
    }

    try {
      usageCode += generateUsageCode(componentName, defaultProps);
    } catch (err) {
      console.error(`✗ Failed to generate usage code:`, err);
      usageCode = '// Error generating usage code';
    }
  }

  writeOutput(dir, tsxCode, jsxCode, usageCode);
});

function writeOutput(dir: string, tsxCode: string, jsxCode: string, usageCode: string) {
  const tsxOutput = `export const tsxCode = ${JSON.stringify(tsxCode)};`;
  const jsxOutput = `export const jsxCode = ${JSON.stringify(jsxCode)};`;
  const usageOutput = `export const usageCode = ${JSON.stringify(usageCode)};`;
  const output = `${tsxOutput}\n\n${jsxOutput}\n\n${usageOutput}`.trim();

  const outputPath = join(dir, 'code.ts');
  try {
    writeFileSync(outputPath, output);
    console.log(`✓ Saved code.ts → ${outputPath}\n`);
  } catch (err) {
    console.error(`✗ Failed to write code.ts: ${outputPath}`, err);
  }
}
