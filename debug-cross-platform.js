#!/usr/bin/env node

// Enhanced debug script for cross-platform testing
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== OddLauncher Cross-Platform Debug Tool ===\n');

// Test different path formats for your specific case
const testPaths = [
  // Your specific paths
  '/home/robert/dev/vets-website',
  '\\\\wsl.localhost\\Ubuntu\\home\\robert\\dev\\vets-website',
  '//wsl.localhost/Ubuntu/home/robert/dev/vets-website',

  // Common Windows paths (adjust as needed)
  'C:\\Users\\robert\\dev\\vets-website',
  'C:/Users/robert/dev/vets-website',
  'C:\\dev\\vets-website',
  'C:/dev/vets-website',

  // WSL mount points
  '/mnt/c/Users/robert/dev/vets-website',
  '/mnt/c/dev/vets-website',
];

console.log('=== System Information ===');
console.log(`OS: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Node.js: ${process.version}`);
console.log(`Current working directory: ${process.cwd()}`);

// Check if we're in WSL
const isWSL = process.platform === 'linux' && fs.existsSync('/proc/version') &&
              fs.readFileSync('/proc/version', 'utf8').includes('Microsoft');
console.log(`Running in WSL: ${isWSL}`);

console.log('\n=== Path Testing ===');
testPaths.forEach(testPath => {
  try {
    if (fs.existsSync(testPath)) {
      const stats = fs.statSync(testPath);
      console.log(`✅ EXISTS: ${testPath} (${stats.isDirectory() ? 'directory' : 'file'})`);

      // Check if package.json exists
      const packageJsonPath = path.join(testPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        console.log(`   📦 Has package.json`);

        // Try to read it
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          console.log(`   📝 Project: ${pkg.name || 'unnamed'}`);
          if (pkg.scripts?.watch) {
            console.log(`   🏃 Has watch script: ${pkg.scripts.watch}`);
          }
        } catch (e) {
          console.log(`   ❌ Error reading package.json: ${e.message}`);
        }
      }
    } else {
      console.log(`❌ NOT FOUND: ${testPath}`);
    }
  } catch (error) {
    console.log(`❌ ERROR accessing ${testPath}: ${error.message}`);
  }
});

console.log('\n=== Command Testing ===');

// Test different ways to run yarn
const commandTests = [
  { name: 'Direct yarn', cmd: 'yarn', args: ['--version'] },
  { name: 'WSL yarn', cmd: 'wsl.exe', args: ['yarn', '--version'] },
  { name: 'Node', cmd: 'node', args: ['--version'] },
  { name: 'WSL node', cmd: 'wsl.exe', args: ['node', '--version'] },
];

async function testCommand(name, command, args) {
  return new Promise((resolve) => {
    console.log(`\n--- Testing ${name}: ${command} ${args.join(' ')} ---`);

    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
      console.log('⏱️ Command timed out (10 seconds)');
      resolve(false);
    }, 10000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0 && stdout.trim()) {
        console.log(`✅ SUCCESS: ${stdout.trim()}`);
        resolve(true);
      } else {
        console.log(`❌ FAILED (code: ${code})`);
        if (stderr) console.log(`   Error: ${stderr.trim()}`);
        resolve(false);
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`❌ COMMAND ERROR: ${error.message}`);
      resolve(false);
    });
  });
}

// Function to test your specific command in different ways
async function testYarnWatchCommand() {
  console.log('\n=== Testing Your Specific Command ===');

  const validPaths = testPaths.filter(p => {
    try {
      return fs.existsSync(p) && fs.existsSync(path.join(p, 'package.json'));
    } catch {
      return false;
    }
  });

  if (validPaths.length === 0) {
    console.log('❌ No valid project paths found');
    return;
  }

  console.log(`Found ${validPaths.length} valid project path(s)`);

  const testDir = validPaths[0];
  console.log(`Using test directory: ${testDir}`);

  const commands = [
    {
      name: 'Direct yarn watch',
      cmd: 'yarn',
      args: ['watch', '--env', 'entry=10210-ja', 'y-witness-statement'],
      cwd: testDir
    }
  ];

  // Add WSL version if we're on Windows or have wsl.exe
  try {
    await testCommand('WSL Check', 'wsl.exe', ['--version']);

    // Convert path for WSL if needed
    let wslDir = testDir;
    if (testDir.startsWith('\\\\wsl.localhost\\')) {
      // Convert \\wsl.localhost\Ubuntu\home\... to /home/...
      const parts = testDir.replace(/\\\\/g, '/').split('/');
      if (parts.length >= 4) {
        wslDir = '/' + parts.slice(3).join('/');
      }
    } else if (testDir.match(/^[A-Z]:/)) {
      // Convert C:/... to /mnt/c/...
      wslDir = testDir.replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`).replace(/\\/g, '/');
    }

    commands.push({
      name: 'WSL yarn watch',
      cmd: 'wsl.exe',
      args: ['--cd', wslDir, 'yarn', 'watch', '--env', 'entry=10210-ja', 'y-witness-statement'],
      cwd: undefined
    });
  } catch (e) {
    console.log('WSL not available, skipping WSL tests');
  }

  for (const test of commands) {
    console.log(`\n--- Testing ${test.name} ---`);
    console.log(`Command: ${test.cmd} ${test.args.join(' ')}`);
    if (test.cwd) console.log(`Working directory: ${test.cwd}`);

    const result = await testCommandWithTimeout(test.cmd, test.args, test.cwd, 5000);
    if (result) {
      console.log('✅ Command started successfully (killed after 5s)');
    } else {
      console.log('❌ Command failed to start');
    }
  }
}

async function testCommandWithTimeout(command, args, cwd, timeout = 5000) {
  return new Promise((resolve) => {
    const options = { stdio: ['pipe', 'pipe', 'pipe'], shell: true };
    if (cwd) options.cwd = cwd;

    const child = spawn(command, args, options);

    let hasOutput = false;

    child.stdout.on('data', (data) => {
      hasOutput = true;
      console.log(`   OUTPUT: ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
      hasOutput = true;
      console.log(`   ERROR: ${data.toString().trim()}`);
    });

    const timer = setTimeout(() => {
      child.kill();
      resolve(hasOutput);
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0 || hasOutput);
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      console.log(`   SPAWN ERROR: ${error.message}`);
      resolve(false);
    });
  });
}

// Run all tests
async function runAllTests() {
  // Test basic commands
  for (const test of commandTests) {
    await testCommand(test.name, test.cmd, test.args);
  }

  // Test your specific yarn watch command
  await testYarnWatchCommand();

  console.log('\n=== Summary ===');
  console.log('✅ Green checkmarks indicate working commands/paths');
  console.log('❌ Red X marks indicate issues that need fixing');
  console.log('');
  console.log('📝 Recommendations:');
  console.log('1. Use paths that show ✅ EXISTS with 📦 Has package.json');
  console.log('2. Use commands that show ✅ SUCCESS');
  console.log('3. If WSL commands work better, the app will automatically use them');
}

setTimeout(runAllTests, 1000);
