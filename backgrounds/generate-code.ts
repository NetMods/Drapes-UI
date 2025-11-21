import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { BundledTheme, codeToHtml } from 'shiki';

export function generateUsageCode(
  componentName: string,
  defaultProps: Record<string, any>
): string {
  const propsString = Object.entries(defaultProps)
    .map(([key, value]) => {
      const propValue = typeof value === 'string' ? `"${value}"` : value;
      return `          ${key}={${propValue}}`;
    })
    .join('\n');

  return `import ${componentName} from '@/components/ui/background';

export default function Page() {
  return (
    <div>
      <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }} >
        <${componentName} 
${propsString}
        />
      </div>
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

async function processFile(file: string) {
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
      return;
    }

    // Match default export
    const exportMatch = configContent.match(/export\s+default\s+([\s\S]*?)(?:as\s+\w+)?\s*;?\s*$/);
    if (!exportMatch) {
      console.warn(`✗ No default export found in config: ${configPath}`);
      return;
    }

    let objectStr = exportMatch[1].trim();
    objectStr = objectStr.replace(/\s+as\s+\w+\s*$/, '').trim();

    // Extract defaultProps
    const defaultPropsMatch = objectStr.match(/defaultProps\s*:\s*({[\s\S]*?})\s*,/);
    if (!defaultPropsMatch) {
      console.warn(`✗ No 'defaultProps' found in exported object`);
      return;
    }

    const defaultPropsStr = defaultPropsMatch[1];

    let defaultProps: any;
    try {
      defaultProps = new Function(`return ${defaultPropsStr}`)();
      console.error(`✓ Found default props`);
    } catch (err) {
      console.error(`✗ Failed to parse defaultProps with Function constructor:`, err);
      return;
    }

    try {
      usageCode += generateUsageCode(componentName, defaultProps);
    } catch (err) {
      console.error(`✗ Failed to generate usage code:`, err);
      usageCode = '// Error generating usage code';
    }
  }

  let tsxCodeHTML, jsxCodeHTML, usageCodeHTML
  const theme = 'material-theme' as BundledTheme;

  try {
    [tsxCodeHTML, jsxCodeHTML, usageCodeHTML] = await Promise.all([
      codeToHtml(tsxCode, { lang: 'tsx', theme }),
      codeToHtml(jsxCode, { lang: 'jsx', theme }),
      codeToHtml(usageCode, { lang: 'jsx', theme })
    ]);
    console.log(`✓ Generated syntax-highlighted HTML for all sections`);
  } catch (err) {
    console.error(`Failed to generate HTML with Shiki:`, err);
    return;
  }

  writeOutput(dir, tsxCodeHTML, tsxCode, jsxCodeHTML, jsxCode, usageCodeHTML, usageCode);
}

function writeOutput(dir: string, tsxCodeHTML: string, tsxCode: string, jsxCodeHTML: string, jsxCode: string, usageCodeHTML: string, usageCode: string) {
  const tsxRawCode = `export const tsxCode = ${JSON.stringify(tsxCode)};`
  const jsxRawCode = `export const jsxCode = ${JSON.stringify(jsxCode)};`
  const tsxOutput = `export const tsxCodeHTML = ${JSON.stringify(tsxCodeHTML)};`;
  const jsxOutput = `export const jsxCodeHTML = ${JSON.stringify(jsxCodeHTML)};`;
  const usageOutput = `export const usageCodeHTML = ${JSON.stringify(usageCodeHTML)};`;
  const usageOutput2 = `export const usageCode = ${JSON.stringify(usageCode)};`;
  const output = `${tsxRawCode}\n\n${jsxRawCode}\n\n${tsxOutput}\n\n${jsxOutput}\n\n${usageOutput}\n\n${usageOutput2}`.trim();

  const outputPath = join(dir, 'code.ts');
  try {
    writeFileSync(outputPath, output);
    console.log(`✓ Saved code.ts → ${outputPath}\n`);
  } catch (err) {
    console.error(`✗ Failed to write code.ts: ${outputPath}`, err);
  }
}

(async () => {
  const backgrounds = glob.sync('backgrounds/*/index.tsx');
  for (const file of backgrounds) {
    await processFile(file);
  }
  console.log('All components processed.');
})();
