const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, '..', 'dist', 'proto');
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, '..', 'proto', 'demo.proto'), path.join(destDir, 'demo.proto'));
console.log('[contracts] copied proto/demo.proto -> dist/proto/demo.proto');