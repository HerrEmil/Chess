import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';

const html = readFileSync('build/index.html', 'utf8');
const css = readFileSync('build/default.css', 'utf8');

const minified = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>+~])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

const replaced = html.replace(
  /<link rel="stylesheet" type="text\/css" href="default\.css" \/>/,
  `<style>${minified}</style>`,
);

writeFileSync('build/index.html', replaced);
if (existsSync('build/default.css')) unlinkSync('build/default.css');
