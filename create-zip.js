#!/usr/bin/env node

import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const output = createWriteStream(resolve('build', 'build.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  console.log(`Created build.zip (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.glob('**/*', { cwd: 'build', ignore: ['build.zip'] });
archive.finalize();
