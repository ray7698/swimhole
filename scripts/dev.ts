import {spawn} from 'node:child_process';

const processes = [
  spawn('cmd.exe', ['/c', 'npm', 'run', 'dev:api'], {stdio: 'inherit'}),
  spawn('cmd.exe', ['/c', 'npm', 'run', 'dev:web'], {stdio: 'inherit'}),
];

const shutdown = () => {
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

Promise.all(
  processes.map(
    (child) => new Promise<number>((resolve) => child.on('exit', (code) => resolve(code ?? 0))),
  ),
).then((codes) => {
  const failed = codes.find((code) => code !== 0);
  process.exit(failed ?? 0);
});
