const child = require("child_process");

class InstallService {

    static async install(root) {
        return new Promise(((resolve, reject) => {
            process.chdir(root);
            try {
                let ps = child.spawn("cmd", ["/c", "npm", "install"]);
                ps.stdout.on('data', (data) => {
                    InstallService.logRow(`[npm install] ${data.toString("utf8")}`);
                });
                ps.stderr.on('data', (data) => {
                    data = (data ? data.toString("utf8").trim() : undefined);
                    if (data) {
                        InstallService.logRow(`[npm install] ${data}`);
                        data = data.toLowerCase();
                        if (data.indexOf("error") !== -1 || data.indexOf(" err") !== -1) {
                            reject(data);
                        }
                    }
                });
                ps.on('close', () => {
                    InstallService.logRow(`[Install ${root}] done`);
                    resolve();
                });
            } catch (e) {
                reject(e);
            }
        }));
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
