#!/usr/bin/env node

/**
 * Test setup verification script
 * Run this to verify that testcontainers setup is working correctly
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing testcontainers setup...\n');

try {
  // Change to server directory
  process.chdir(__dirname);
  
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n🐳 Running testcontainers verification test...');
  execSync('npm run test:database -- --testNamePattern="Testcontainers Verification"', { 
    stdio: 'inherit',
    timeout: 120000 // 2 minutes timeout
  });
  
  console.log('\n✅ Testcontainers setup is working correctly!');
  console.log('\n📋 Available test commands:');
  console.log('  npm test                 - Run all tests');
  console.log('  npm run test:unit        - Run unit tests only');
  console.log('  npm run test:integration - Run integration tests only');
  console.log('  npm run test:database    - Run database tests only');
  console.log('  npm run test:coverage    - Run tests with coverage');
  console.log('  npm run test:watch       - Run tests in watch mode');
  
} catch (error) {
  console.error('\n❌ Testcontainers setup failed:');
  console.error(error.message);
  
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Ensure Docker is running');
  console.log('2. Check that port 5432 is not in use');
  console.log('3. Verify Node.js version is 16+ and npm is installed');
  console.log('4. Try running: docker system prune -f');
  
  process.exit(1);
}