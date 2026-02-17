import { execSync, spawn } from 'child_process';

const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
const quietFlag = verbose ? '' : ' --quiet';

try {
  execSync(`pnpx tsx backgrounds/generate-index.ts${quietFlag}`, { stdio: 'inherit' });
  execSync(`pnpx tsx backgrounds/generate-code.ts${quietFlag}`, { stdio: 'inherit' });
} catch {
  process.exit(1);
}

const next = spawn('pnpx', ['next', 'dev', '--turbo'], {
  stdio: 'inherit',
  shell: true,
});

next.on('close', (code) => {
  process.exit(code ?? 0);
});
