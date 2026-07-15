const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replaceImports = (filePath) => {
  if (!filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const funcsToMove = ['calculatePrayerTimes', 'calculatePrayerTimesAsync', 'getPrayerTimesAsync'];
  // We don't want to replace getPrayerTimes because tests might use it via index.ts (legacy getPrayerTimes is renamed to getPrayerTimesLegacy but let's see). Wait, original getPrayerTimes is in legacy.js as getPrayerTimesLegacy! If tests use getPrayerTimes, we need to map it to getPrayerTimesLegacy.
  if (content.includes('getPrayerTimes') && !content.includes('getPrayerTimesAsync') && !content.includes('UnifiedPrayerTimesResult')) {
    content = content.replace(/\bgetPrayerTimes\b/g, 'getPrayerTimesLegacy');
    funcsToMove.push('getPrayerTimesLegacy');
    changed = true;
  }
  
  const matches = content.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g);
  if (matches) {
    matches.forEach(match => {
      if (match.includes('/prayers/index.js') || match.includes('/prayers/index') || match.includes('../src/prayers') || match.includes('../../src/prayers')) {
        let imports = match.match(/{([^}]+)}/)[1].split(',').map(s => s.trim());
        let legacyImports = [];
        let mainImports = [];
        imports.forEach(i => {
          if (funcsToMove.includes(i) || i === 'getPrayerTimesLegacy') {
            legacyImports.push(i);
          } else {
            mainImports.push(i);
          }
        });
        
        if (legacyImports.length > 0) {
          changed = true;
          let replacement = '';
          if (mainImports.length > 0) {
            replacement += `import { ${mainImports.join(', ')} } from '${match.match(/from\s+['"]([^'"]+)['"]/)[1]}';\n`;
          }
          // The relative path to legacy.js is the same as the path to index.js
          const legacyPath = match.match(/from\s+['"]([^'"]+)['"]/)[1].replace('index.js', 'legacy.js').replace('src/prayers', 'src/prayers/legacy.js').replace('legacy.js/legacy.js', 'legacy.js');
          let fixedLegacyPath = legacyPath;
          if (!fixedLegacyPath.includes('legacy.js')) {
            if (fixedLegacyPath.endsWith('prayers')) fixedLegacyPath += '/legacy.js';
            else if (fixedLegacyPath.endsWith("prayers'")) fixedLegacyPath = fixedLegacyPath.replace("prayers'", "prayers/legacy.js'");
          }
          replacement += `import { ${legacyImports.join(', ')} } from '${fixedLegacyPath}';`;
          content = content.replace(match, replacement);
        }
      }
    });
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
  }
};

walk('tests/prayers', replaceImports);
walk('manual_testing', replaceImports);
