const npm = require('npm');
const path = require("path");

class InstallService {

    static async install(root) {
        return new Promise((resolve, reject) => {
            try {
                process.chdir(root);
                npm.load(path.join(root, "package.json"), function (er) {
                    if (er) reject(er);
                    else {
                        npm.commands.install([], function (er, data) {
                            if (er) reject(er);
                            else resolve();
                        });
                        npm.on('log', function (data) {
                            data = (data ? data.toString("utf8").trim() : undefined);
                            if (data) {
                                InstallService.logRow(`[npm install] ${data}`);
                            }
                        })
                    }

                });
            } catch (e) {
                reject(e);
            }
        });
    }

    static logRow(str) {
        str = str.replace("[", '\x1b[35m[');
        str = str.replace("]", ']\x1b[0m');
        str = str.replace("WARN", '\x1b[33mWARN\x1b[0m');
        str = str.replace("ERROR", '\x1b[31mERROR\x1b[0m');
        console.log(str);
    }

}

module.exports.InstallService = InstallService;
