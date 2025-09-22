// Project setup verification script
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    // Root files
    'package.json',
    'README.md',
    '.gitignore',

    // Server files
    'server/package.json',
    'server/src/index.js',
    'server/src/config/database.js',
    'server/src/models/index.js',
    'server/src/routes/index.js',
    'server/src/services/index.js',
    'server/src/middleware/index.js',
    'server/.env.example',

    // Client files
    'client/package.json',
    'client/App.js',
    'client/app.json',
    'client/babel.config.js',
    'client/src/components/index.js',
    'client/src/screens/index.js',
    'client/src/services/index.js',
    'client/src/context/index.js',
    'client/src/utils/index.js',
    'client/src/config/api.js'
];

const requiredDirectories = [
    'server',
    'server/src',
    'server/src/config',
    'server/src/models',
    'server/src/routes',
    'server/src/services',
    'server/src/middleware',
    'server/src/scripts',
    'server/src/__tests__',
    'client',
    'client/src',
    'client/src/components',
    'client/src/screens',
    'client/src/services',
    'client/src/context',
    'client/src/utils',
    'client/src/config',
    'client/src/__tests__',
    'client/assets'
];

console.log('🔍 Verifying project setup...\n');

let allGood = true;

// Check directories
console.log('📁 Checking directories:');
requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        console.log(`✅ ${dir}`);
    } else {
        console.log(`❌ ${dir} - Missing directory`);
        allGood = false;
    }
});

console.log('\n📄 Checking files:');
// Check files
requiredFiles.forEach(file => {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - Missing file`);
        allGood = false;
    }
});

console.log('\n📦 Checking package.json dependencies:');

// Check server dependencies
try {
    const serverPkg = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
    const requiredServerDeps = ['express', 'socket.io', 'sequelize', 'pg', 'jsonwebtoken'];

    requiredServerDeps.forEach(dep => {
        if (serverPkg.dependencies && serverPkg.dependencies[dep]) {
            console.log(`✅ Server: ${dep}`);
        } else {
            console.log(`❌ Server: ${dep} - Missing dependency`);
            allGood = false;
        }
    });
} catch (error) {
    console.log('❌ Could not read server/package.json');
    allGood = false;
}

// Check client dependencies
try {
    const clientPkg = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
    const requiredClientDeps = ['react', 'react-native', '@react-navigation/native', 'socket.io-client'];

    requiredClientDeps.forEach(dep => {
        if (clientPkg.dependencies && clientPkg.dependencies[dep]) {
            console.log(`✅ Client: ${dep}`);
        } else {
            console.log(`❌ Client: ${dep} - Missing dependency`);
            allGood = false;
        }
    });
} catch (error) {
    console.log('❌ Could not read client/package.json');
    allGood = false;
}

console.log('\n' + '='.repeat(50));

if (allGood) {
    console.log('🎉 Project setup verification completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run "npm run install:all" to install dependencies');
    console.log('2. Set up your PostgreSQL database');
    console.log('3. Copy server/.env.example to server/.env and configure');
    console.log('4. Run "npm run dev" to start development servers');
} else {
    console.log('❌ Project setup verification failed!');
    console.log('Please check the missing files and directories above.');
    process.exit(1);
}

console.log('='.repeat(50));