#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Development script to run PHP tests and handle output streams properly
 * This script demonstrates proper handling of both stdout and stderr from PHP processes
 * Designed to work cross-platform (Windows, macOS, Linux)
 */

function runPhpTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running test: ${path.basename(testFile)}`);
    
    // Use 'php' command directly - Windows will handle .exe extension automatically
    const phpProcess = spawn('php', [testFile], {
      cwd: path.dirname(testFile),
      // Ensure stdio is properly configured for cross-platform compatibility
      stdio: ['pipe', 'pipe', 'pipe'],
      // On Windows, use shell to properly locate PHP executable
      shell: process.platform === 'win32'
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
      
      // Provide helpful error messages for common issues
      if (error.code === 'ENOENT') {
        console.error('Make sure PHP is installed and available in your PATH');
        if (process.platform === 'win32') {
          console.error('On Windows, you may need to:');
          console.error('1. Install PHP from https://windows.php.net/download/');
          console.error('2. Add PHP to your system PATH');
          console.error('3. Restart your command prompt/IDE');
        }
      }
      
      reject(error);
    });
  });
}

async function runAllTests() {
  const testsDir = path.join(__dirname, 'tests');
  
  if (!fs.existsSync(testsDir)) {
    console.error('Tests directory not found');
    process.exit(1);
  }

  const testFiles = fs.readdirSync(testsDir)
    .filter(file => file.endsWith('.php'))
    .map(file => path.join(testsDir, file));

  console.log(`Found ${testFiles.length} PHP test files`);

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

module.exports = { runPhpTest, runAllTests };