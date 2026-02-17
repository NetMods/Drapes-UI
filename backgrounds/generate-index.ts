import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { RegistryEntries } from './registry.config';

const quiet = process.argv.includes('--quiet');
const log = quiet ? (..._args: unknown[]) => { } : console.log.bind(console);

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function generateIndexFile() {
  const validBackgrounds = RegistryEntries.filter(entry => {
    const folder = entry.endsWith('+') ? entry.slice(0, -1) : entry;
    const indexPath = join('backgrounds', folder, 'index.tsx');
    const configPath = join('backgrounds', folder, 'config.ts');

    if (!existsSync(indexPath) || !existsSync(configPath)) {
      console.warn(`⚠️  Skipping ${folder}: missing index.tsx or config.ts`);
      return false;
    }
    return true;
  });

  if (validBackgrounds.length === 0) {
    console.error('❌ No valid backgrounds found in registry config');
    return;
  }

  const backgrounds = validBackgrounds.map(entry => {
    const folder = entry.endsWith('+') ? entry.slice(0, -1) : entry;
    const isNew = entry.endsWith('+');

    return {
      folderName: folder,
      componentName: kebabToPascal(folder),
      relativePath: `./${folder}`,
      isNew: isNew || false,
    }
  });

  const componentImports = backgrounds
    .map(bg => `import ${bg.componentName} from '${bg.relativePath}'`)
    .join('\n');

  const configImports = backgrounds
    .map(bg => {
      const configVarName = bg.componentName.charAt(0).toLowerCase() + bg.componentName.slice(1) + 'Config';
      return `import ${configVarName} from '${bg.relativePath}/config';`;
    })
    .join('\n');

  const registryEntries = backgrounds
    .map(bg => {
      const configName = bg.componentName.charAt(0).toLowerCase() + bg.componentName.slice(1) + 'Config';
      const isNewProp = bg.isNew ? ', isNew: true' : '';
      return `  { config: ${configName}, component: ${bg.componentName}${isNewProp} },`;
    })
    .join('\n');

  const content = `import { registry } from '@/lib/registry';
import { BackgroundConfig, BackgroundEntry } from '@/lib/types';

//import components
${componentImports}

//import config
${configImports}

const registerEntry: BackgroundEntry[] = [
${registryEntries}
]

registerEntry.forEach((entry: BackgroundEntry, index) => {
  const id = String(index + 1);

  const configWithId: BackgroundConfig = { ...entry.config, id };

  registry.register({
    config: configWithId,
    component: entry.component,
    isNew: entry.isNew,
  });
})
`;

  const outputPath = 'backgrounds/index.ts';
  writeFileSync(outputPath, content);
  log(`✅ Generated ${outputPath} with ${backgrounds.length} backgrounds:`);
  backgrounds.forEach((bg, idx) => {
    const newBadge = bg.isNew ? ' [NEW]' : '';
    log(`   ${idx + 1}. ${bg.componentName} (${bg.folderName})${newBadge}`);
  });

  // Generate server-side index (configs only, no React components)
  const serverConfigImports = backgrounds
    .map(bg => {
      const configVarName = bg.componentName.charAt(0).toLowerCase() + bg.componentName.slice(1) + 'Config';
      return `import ${configVarName} from '${bg.relativePath}/config';`;
    })
    .join('\n');

  const serverRegistryEntries = backgrounds
    .map((bg, idx) => {
      const configName = bg.componentName.charAt(0).toLowerCase() + bg.componentName.slice(1) + 'Config';
      return `  { ...${configName}, id: '${idx + 1}' },`;
    })
    .join('\n');

  const serverContent = `import { serverRegistry } from '@/lib/server-registry';
import { BackgroundConfig } from '@/lib/types';

${serverConfigImports}

const configs: BackgroundConfig[] = [
${serverRegistryEntries}
]

configs.forEach((config) => {
  serverRegistry.register(config as BackgroundConfig);
})
`;

  const serverOutputPath = 'backgrounds/server-index.ts';
  writeFileSync(serverOutputPath, serverContent);
  log(`✅ Generated ${serverOutputPath} (server-safe, configs only)`);
}

generateIndexFile();
