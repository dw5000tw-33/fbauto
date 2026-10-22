const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const paths = fs.readdirSync('alpha').filter(x => /\.js$/.test(x)).map(x => path.join('alpha', x));
paths.push('panel-v1.7.js', 'panel-v1.8.js', 'panel-v1.9 js', 'deleteCore.js');
for (const file of paths) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
for (const file of ['alpha/verify-loader.html', 'alpha/panel-bootstrap.html', 'alpha/scheduler-bootstrap.html', 'panel-bootstrap.html']) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1], { filename: file });
}
console.log(`Syntax checked ${paths.length} JavaScript files and four loaders`);
