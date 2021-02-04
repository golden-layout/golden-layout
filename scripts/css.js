/* eslint-disable */
const fs = require('fs');
const path = require('path');
const less = require('less');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

// This script performs three tasks:
// 1. Copy LESS and SCSS stylesheets to dist
// 2. Render LESS to CSS and copy it to dist
// 3. Copy images to dist

// Helper function to ensure a directory exists.
// Won't do anything if the directory already exists
const ensureFolder = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

// Helper function to build a single less file and write the output to a css file.
// It additionally copies the raw less file to dist
// Must be called for every .less file in src folder.
const buildFile = async (filePath) => {
    console.log(`[INFO] Processing file: ${filePath}`);
    const outputPath = filePath.replace('less', 'css').replace('src', 'dist/golden-layout').replace('.less', '.css');
    const lessRawOutputFile = filePath.replace('src', 'dist/golden-layout');
    console.log(`[INFO] ${filePath} => render => ${outputPath}`);
    console.log(`[INFO] ${filePath} => copy => ${lessRawOutputFile}`);

    const lessFile = fs.readFileSync(filePath, 'utf8');
    const lessOutput = await less.render(lessFile);
    const prefixedOutput = await postcss([autoprefixer]).process(lessOutput.css, { from: filePath });
    prefixedOutput.warnings().forEach(warn => {
        console.warn(`[${filePath}] [WARN]: ${warn}`);
    });
    // Write the CSS file
    fs.writeFileSync(outputPath, prefixedOutput.css);
    // Copy the less file
    fs.writeFileSync(lessRawOutputFile, lessFile);
};

console.log('[INFO] Creating directories');

// We do not have mkdir -p without an extra dependency.
ensureFolder('./dist');
ensureFolder('./dist/golden-layout');
ensureFolder('./dist/golden-layout/css');
ensureFolder('./dist/golden-layout/less');
ensureFolder('./dist/golden-layout/scss');
ensureFolder('./dist/golden-layout/css/themes');
ensureFolder('./dist/golden-layout/less/themes');
ensureFolder('./dist/golden-layout/scss/themes');
ensureFolder('./dist/golden-layout/img');


// Build base.less file
buildFile('./src/less/goldenlayout-base.less');
// Copy the base scss file
fs.copyFileSync('./src/scss/goldenlayout-base.scss', './dist/golden-layout/scss/goldenlayout-base.scss');

// Build every less theme
fs.readdirSync('./src/less/themes').forEach(file => {
    buildFile(path.join(`./src/less/themes/`, file));
});

// Copy SCSS themes to dist
fs.readdirSync('./src/scss/themes').forEach(file => {
    const srcPath = path.join('./src/scss/themes', file);
    const dstPath = path.join('./dist/golden-layout/scss/themes', file);
    console.log(`[INFO] ${srcPath} => copy => ${dstPath}`);
    fs.copyFileSync(srcPath, dstPath);
});

// Copy Images to dist
fs.readdirSync('./src/img').forEach(file => {
    const srcPath = path.join('./src/img', file);
    const dstPath = path.join('./dist/golden-layout/img', file);
    console.log(`[INFO] ${srcPath} => copy => ${dstPath}`);
    fs.copyFileSync(srcPath, dstPath);
});
