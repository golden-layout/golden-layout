const fs = require("fs")
const path = require("path")
const less = require("less")

// This ensures a directory. If the directory already exists, we do not do anything.
const ensureFolder = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

// This builds a single less file and writes a single output file
// Must be called for every .less file in src folder.
const buildFile = async (filePath) => {
    const outputPath = filePath.replace(".less", ".css").replace("src", "dist")
    const lessFile = fs.readFileSync(filePath, "utf8")
    const lessOutput = await less.render(lessFile)
    fs.writeFileSync(outputPath, lessOutput.css)
}

// We do not have mkdir -p without an extra dependency.
ensureFolder("./dist")
ensureFolder("./dist/less")
ensureFolder("./dist/less/themes")

// Build base.less file
buildFile("./src/less/goldenlayout-base.less")

// Build every theme
fs.readdirSync("./src/less/themes").forEach(file => {
    buildFile(path.join(`./src/less/themes/`, file))
});