#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Development script to run PHP tests and handle output streams properly
 * This script demonstrates proper handling of both stdout and stderr from PHP processes
 */

function runPhpTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running test: ${path.basename(testFile)}`);
    
    const phpProcess = spawn('php', [testFile], {
      cwd: path.dirname(testFile)
    });

    let hasOutput = false;

    // Handle stdout - existing pattern that works correctly
    phpProcess.stdout.on('data', (data) => {
      hasOutput = true;
      console.log(`[php] ${data.toString()}`.trim());
    });

    // Handle stderr - apply the same toString() pattern as stdout
    phpProcess.stderr.on('data', (data) => {
      hasOutput = true;
      console.error(`[php] ${data.toString()}`.trim());
    });

    phpProcess.on('close', (code) => {
      if (!hasOutput) {
        console.log(`[php] Test completed silently`);
      }
      
      if (code === 0) {
        console.log(`✅ ${path.basename(testFile)} passed`);
        resolve(code);
      } else {
        console.error(`❌ ${path.basename(testFile)} failed with exit code ${code}`);
        reject(new Error(`Test failed with exit code ${code}`));
      }
    });

    phpProcess.on('error', (error) => {
      console.error(`Failed to start PHP process: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Run PHP lint check on all PHP source files under a directory.
 * Returns a promise that resolves on success or rejects on syntax errors.
 */
function runPhpLint(sourceDir) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 PHP lint check: ${sourceDir}`);

    const phpFiles = [];
    function collectPhpFiles(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectPhpFiles(full);
        } else if (entry.isFile() && entry.name.endsWith('.php')) {
          phpFiles.push(full);
        }
      }
    }
    collectPhpFiles(sourceDir);

    if (phpFiles.length === 0) {
      console.log('[lint] No PHP files found');
      resolve();
      return;
    }

    let lintErrors = 0;
    let pending = phpFiles.length;

    phpFiles.forEach((file) => {
      const proc = spawn('php', ['-l', file]);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        if (code !== 0) {
          lintErrors++;
          console.error(`[lint] ❌ ${file}`);
          if (stderr.trim()) console.error(`       ${stderr.trim()}`);
        }
        pending--;
        if (pending === 0) {
          if (lintErrors === 0) {
            console.log(`[lint] ✅ All ${phpFiles.length} PHP files passed syntax check`);
            resolve();
          } else {
            reject(new Error(`PHP lint failed: ${lintErrors} file(s) have syntax errors`));
          }
        }
      });
      proc.on('error', (err) => {
        pending--;
        lintErrors++;
        console.error(`[lint] Failed to run php -l on ${file}: ${err.message}`);
        if (pending === 0) {
          reject(new Error(`PHP lint failed`));
        }
      });
    });
  });
}

async function runAllTests() {
  const testsDir = path.join(__dirname, 'tests');
  
  if (!fs.existsSync(testsDir)) {
    console.error('Tests directory not found');
    process.exit(1);
  }

  // PHP lint check first
  try {
    await runPhpLint(path.join(__dirname, 'app'));
  } catch (lintError) {
    console.error(`\n💥 PHP lint check failed: ${lintError.message}`);
    process.exit(1);
  }

  const testFiles = fs.readdirSync(testsDir)
    .filter(file => file.endsWith('.php'))
    .map(file => path.join(testsDir, file));

  console.log(`\nFound ${testFiles.length} PHP test files`);

  let passed = 0;
  let failed = 0;

  for (const testFile of testFiles) {
    try {
      await runPhpTest(testFile);
      passed++;
    } catch (error) {
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total: ${testFiles.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runPhpTest, runPhpLint, runAllTests };
