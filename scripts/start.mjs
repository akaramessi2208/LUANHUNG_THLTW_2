import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath;
const children = [];
let stopping = false;

function stopChildren(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  process.exitCode = exitCode;
}

for (const workspace of ['backend', 'frontend']) {
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = npmCli
    ? [npmCli, '--workspace', workspace, 'run', 'start']
    : ['--workspace', workspace, 'run', 'start'];
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: !npmCli && process.platform === 'win32',
    windowsHide: true,
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`Failed to start ${workspace}:`, error);
    stopChildren(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stopChildren(code || 0);
  });
}

process.on('SIGINT', () => stopChildren(0));
process.on('SIGTERM', () => stopChildren(0));
