#!/usr/bin/env node

// Debug script to help test different path formats and command execution
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== OddLauncher Path Debug Tool ===\n');

// Test different path formats
const testPaths = [
  // Linux/WSL paths
  '/home/robert/dev/vets-website',
  '/mnt/c/Users/robert/dev/vets-website', // WSL mount

  // Windows paths
  'C:\\Users\\robert\\dev\\vets-website',
  'C:/Users/robert/dev/vets-website',

  // Network paths
  '\\\\wsl.localhost\\Ubuntu\\home\\robert\\dev\\vets-website',
  '//wsl.localhost/Ubuntu/home/robert/dev/vets-website',
];

console.log('Testing path accessibility:');
testPaths.forEach(testPath => {
  try {
    if (fs.existsSync(testPath)) {
      const stats = fs.statSync(testPath);
      console.log(`✅ EXISTS: ${testPath} (${stats.isDirectory() ? 'directory' : 'file'})`);

      // Check if package.json exists
      const packageJsonPath = path.join(testPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        console.log(`   📦 Has package.json`);
      }
    } else {
      console.log(`❌ NOT FOUND: ${testPath}`);
    }
  } catch (error) {
    console.log(`❌ ERROR accessing ${testPath}: ${error.message}`);
  }
});

console.log('\n=== Testing yarn command ===');

// Test yarn availability
exec('which yarn || where yarn', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ yarn not found in PATH');
    console.log('   Try: npm install -g yarn');
  } else {
    console.log(`✅ yarn found at: ${stdout.trim()}`);

    // Test yarn version
    exec('yarn --version', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ yarn version check failed:', error.message);
      } else {
        console.log(`✅ yarn version: ${stdout.trim()}`);
      }
    });
  }
});

console.log('\n=== Environment Info ===');
console.log(`OS: ${process.platform}`);
console.log(`Node.js: ${process.version}`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`PATH: ${process.env.PATH?.split(path.delimiter).join('\n   ')}`);

// Function to test command execution in different directories
function testCommandInDirectory(directory, command, args) {
  return new Promise((resolve) => {
    console.log(`\n--- Testing command in: ${directory} ---`);
    console.log(`Command: ${command} ${args.join(' ')}`);

    if (!fs.existsSync(directory)) {
      console.log('❌ Directory does not exist');
      resolve(false);
      return;
    }

    const child = spawn(command, args, {
      cwd: directory,
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
      console.log('⏱️ Command timed out (5 seconds) - likely started successfully');
      resolve(true);
    }, 5000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      console.log(`Process exited with code: ${code}`);
      if (stdout) console.log(`STDOUT: ${stdout.substring(0, 200)}...`);
      if (stderr) console.log(`STDERR: ${stderr.substring(0, 200)}...`);
      resolve(code === 0);
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`❌ Command failed: ${error.message}`);
      resolve(false);
    });
  });
}

// Wait a bit for yarn check to complete, then test commands
setTimeout(async () => {
  console.log('\n=== Testing yarn watch command ===');

  const validPaths = testPaths.filter(p => fs.existsSync(p));

  if (validPaths.length === 0) {
    console.log('❌ No valid paths found. Please update the testPaths array with your actual project path.');
    return;
  }

  console.log(`Found ${validPaths.length} valid paths. Testing commands...`);

  for (const testPath of validPaths.slice(0, 2)) { // Test first 2 valid paths
    await testCommandInDirectory(testPath, 'yarn', ['--version']);
    await testCommandInDirectory(testPath, 'yarn', ['watch', '--help']);
  }

}, 2000);
