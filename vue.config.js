const path = require("path");
module.exports = {
    lintOnSave: false,
    outputDir: path.resolve(__dirname, "./../dist"),
    devServer: {
        port: 8081
    }
}