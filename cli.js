#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { compileMerchant } = require('./engine/compiler.js');
const { validateMerchant } = require('./engine/validator.js');

const args = process.argv.slice(2);
const command = args[0] || 'help';

console.log('⚡ BLACKTHRONE — Master Merchant Experience Engine\n');

switch (command) {
    case 'build':
        handleBuild();
        break;
    case 'validate':
        handleValidate();
        break;
    case 'list':
        handleList();
        break;
    case 'preview':
        handlePreview();
        break;
    case 'help':
    default:
        showHelp();
        break;
}

function handleBuild() {
    const presetName = args[1];
    if (!presetName) {
        console.error('❌ Error: Missing preset name. Example: node cli.js build scoop-n-brew');
        process.exit(1);
    }

    const presetPath = resolvePreset(presetName);
    if (!fs.existsSync(presetPath)) {
        console.error(`❌ Preset file not found at: ${presetPath}`);
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(presetPath, 'utf8'));

    // Validate
    const validation = validateMerchant(config);
    if (!validation.valid) {
        console.error('❌ Validation failed with errors:');
        validation.errors.forEach(e => console.error('  - ' + e));
        process.exit(1);
    }
    if (validation.warnings.length > 0) {
        console.warn('⚠️ Warnings:');
        validation.warnings.forEach(w => console.warn('  - ' + w));
    }

    // Determine output directory
    let outDir = path.join(__dirname, 'output', config.id);
    const outIdx = args.indexOf('--out');
    if (outIdx !== -1 && args[outIdx + 1]) {
        outDir = path.resolve(args[outIdx + 1]);
    }

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    // Copy assets if engine/assets exists
    const engineAssets = path.join(__dirname, 'engine', 'assets');
    const outAssets = path.join(outDir, 'assets');
    if (fs.existsSync(engineAssets)) {
        try {
            fs.cpSync(engineAssets, outAssets, { recursive: true });
        } catch (err) {
            console.warn('⚠️ Warning: Could not copy assets:', err.message);
        }
    }

    // Compile
    console.log(`🔨 Compiling "${config.name}"...`);
    const html = compileMerchant(config);
    const htmlFile = path.join(outDir, 'index.html');
    fs.writeFileSync(htmlFile, html, 'utf8');

    // Also write package.json if not present
    const pkgFile = path.join(outDir, 'package.json');
    if (!fs.existsSync(pkgFile)) {
        const pkgContent = {
            name: `${config.id}-review-experience`,
            version: "1.0.0",
            description: `AI-Powered Google Reviews & Experience Landing Page for ${config.name}`,
            scripts: { "dev": "npx serve . -l 3000", "preview": "npx serve . -l 8080" },
            author: "BlackThrone Engine",
            license: "MIT"
        };
        fs.writeFileSync(pkgFile, JSON.stringify(pkgContent, null, 2), 'utf8');
    }

    console.log(`✅ Success! Generated standalone merchant page:`);
    console.log(`   📂 Directory: ${outDir}`);
    console.log(`   📄 Entry:     ${htmlFile}`);
}

function handleValidate() {
    const presetName = args[1];
    if (!presetName) {
        console.error('❌ Missing preset name.');
        process.exit(1);
    }
    const presetPath = resolvePreset(presetName);
    const config = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
    const res = validateMerchant(config);
    if (res.valid) {
        console.log(`✨ Preset "${config.name}" is 100% VALID!`);
    } else {
        console.error(`❌ Validation failed:`);
        res.errors.forEach(e => console.error('  - ' + e));
    }
}

function handleList() {
    const presetsDir = path.join(__dirname, 'presets');
    const files = fs.readdirSync(presetsDir).filter(f => f.endsWith('.json'));
    console.log('Available Merchant Presets:');
    files.forEach(f => {
        const data = JSON.parse(fs.readFileSync(path.join(presetsDir, f), 'utf8'));
        console.log(`  - ${f.replace('.json', '')}: ${data.name} (${data.categoryBadge || ''})`);
    });
}

function handlePreview() {
    handleBuild();
    const presetName = args[1];
    const presetPath = resolvePreset(presetName);
    const config = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
    const outDir = path.join(__dirname, 'output', config.id);
    console.log(`\n🚀 Launching local preview for ${config.name}...`);
    try {
        execSync(`npx serve "${outDir}" -l 4000`, { stdio: 'inherit' });
    } catch (e) {
        console.log('Preview ended.');
    }
}

function resolvePreset(name) {
    if (name.endsWith('.json') && fs.existsSync(name)) return name;
    return path.join(__dirname, 'presets', name.replace('.json', '') + '.json');
}

function showHelp() {
    console.log(`Usage: node cli.js <command> [options]

Commands:
  build <preset> [--out <dir>]   Compile a merchant into a standalone site
  validate <preset>              Validate a merchant configuration file
  list                           List all configured presets
  preview <preset>               Compile and launch an instant local preview server

Examples:
  node cli.js build scoop-n-brew
  node cli.js build bluedoor --out "D:/Business 2027/Bluedoor-Export"
  node cli.js validate scoop-n-brew
  node cli.js preview scoop-n-brew
`);
}
