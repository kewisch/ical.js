import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// JSDoc build orchestration script
// Handles the two-phase documentation generation process:
// 1. Type collection phase (generates type information)
// 2. Full documentation phase (generates themed HTML documentation)

const docsDir = 'docs/api';

console.log('📚 Building JSDoc documentation...\n');

// Phase 1: Type collection
console.log('Phase 1: Collecting type information...');
try {
  // Type collection configuration (phase 1)
  const prepareConfig = {
    source: {
      include: 'lib/ical',
      includePattern: '.js$'
    },
    plugins: [
      'tools/jsdoc-collect-types.cjs',
      'node_modules/jsdoc-tsimport-plugin/index.js'
    ],
    opts: {
      destination: 'docs/api/'
    }
  };
  
  const tempConfig = '.jsdoc-prepare-temp.json';
  fs.writeFileSync(tempConfig, JSON.stringify(prepareConfig, null, 2));
  
  execSync(`./node_modules/.bin/jsdoc --configure ${tempConfig}`, { stdio: 'inherit' });
  fs.unlinkSync(tempConfig);
  
  console.log('✔ Type information collected\n');
} catch (err) {
  console.error('✗ Type collection failed:', err.message);
  process.exit(1);
}

// Clean output between phases
console.log('Cleaning output between phases...');
if (fs.existsSync(docsDir)) {
  fs.rmSync(docsDir, { recursive: true, force: true });
}

// Phase 2: Full documentation
console.log('Phase 2: Generating documentation with theme...');
try {
  execSync('./node_modules/.bin/jsdoc --configure .jsdocrc.json --verbose', { stdio: 'inherit' });
  console.log('\n✔ Documentation generated successfully');
} catch (err) {
  console.error('✗ Documentation generation failed:', err.message);
  process.exit(1);
}

console.log('✔ JSDoc build complete!\n');
