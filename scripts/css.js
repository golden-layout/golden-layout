const fs = require("fs");
const path = require("path");
const less = require("less");
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

// This ensures a directory. If the directory already exists, we do not do anything.
const ensureFolder = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

// This builds a single less file and writes a single output file
// Must be called for every .less file in src folder.
const buildFile = async (filePath) => {
    const outputPath = filePath.replace("less", "css").replace("src", "dist").replace(".less", ".css")
    const lessFile = fs.readFileSync(filePath, "utf8");
    const lessOutput = await less.render(lessFile);
    const prefixedOutput = await postcss([autoprefixer]).process(lessOutput.css, { from: filePath });
    prefixedOutput.warnings().forEach(warn => {
        console.warn(`[${filePath}] [WARN]: ${warn}`);
    });
    fs.writeFileSync(outputPath, prefixedOutput.css)
};

// We do not have mkdir -p without an extra dependency.
ensureFolder("./dist");
ensureFolder("./dist/css");
ensureFolder("./dist/css/themes");

// Build base.less file
buildFile("./src/less/goldenlayout-base.less");

// Build every theme
fs.readdirSync("./src/less/themes").forEach(file => {
    buildFile(path.join(`./src/less/themes/`, file));
});
