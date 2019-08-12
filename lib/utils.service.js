const fs = require("fs-extra");
const fss = require("fs");
const path = require("path");
const crypto = require("crypto");
const tmp = require("tmp");
const tempDirectory = require('temp-dir');
const {CliService} = require("./cli.service");

let tmpCleanupMap = {};
let tmpFolderPrefix = "sminstall-tmp_";

class Utils {

    static get RunningProcessesDir() {
        return path.join(CliService.Options.foldersPath, "rp");
    }

    static async readDir(dir) {
        return new Promise((resolve, reject) => {
            fss.readdir(dir, async (err, files) => {
                if (err)
                    reject(err);
                else
                    resolve(files);
            });
        });
    }

    static async cleanTmpFolders() {
        return new Promise(async (resolve, reject) => {
            try {
                let files = await Utils.fileExists(tempDirectory) ? await Utils.readDir(tempDirectory) : [];
                let processes = await Utils.fileExists(Utils.RunningProcessesDir) ? await Utils.readDir(Utils.RunningProcessesDir) : [];
                let sminstallTmpFolders = files
                    .filter(f => f.startsWith(tmpFolderPrefix))
                    .filter(f => {
                        return processes.indexOf(f) < 0;
                    });

                await Promise.all(sminstallTmpFolders
                    .map(async f => await Utils.deleteDir(path.resolve(tempDirectory, f))))
                //.map(async f => await Promise.resolve()))
                    .then(() => {
                        resolve();
                    })
                    .catch(e => {
                        reject(e);
                    });
            } catch (e) {
                reject(e);
            }
        });

    }

    static async deleteDir(dir) {
        return await fs.remove(dir);
    }

    static async ensureDir(dir) {
        return await fs.ensureDir(dir);
    }

    static async getJson(file) {
        return await fs.readJson(file);
    }

    static async createJson(fname, obj) {
        return await fs.writeJson(fname, obj);
    }

    static async hashFromString(string) {
        let hash;
        try {
            hash = crypto.createHash('md5').update(string.trim()).digest('hex');
        } catch (e) {
            return await Promise.reject(e);
        }
        return await Promise.resolve(hash);
    }

    static async fileExists(file) {
        return await Promise.resolve(fss.existsSync(file));
    }

    static async createTmpFolder() {
        return await new Promise(((resolve, reject) => {
            tmp.dir({
                prefix: tmpFolderPrefix,
                unsafeCleanup: true
            }, async (err, path, cleanupCallback) => {
                if (err) {
                    reject(err);
                } else {
                    const hashKey = await Utils.hashFromString(path);
                    tmpCleanupMap[hashKey] = cleanupCallback;
                    await Utils.addTmpToRunningProcesses(path);
                    resolve(path);
                }
            });
        }));
    }

    static async addTmpToRunningProcesses(tmpPath) {
        await Utils.ensureDir(Utils.RunningProcessesDir);
        await fs.ensureFile(path.resolve(Utils.RunningProcessesDir, path.parse(tmpPath).name));
        return await Promise.resolve();
    }

    static async removeRunningProcesses(tmpPath) {
        return await Utils.deleteDir(path.resolve(Utils.RunningProcessesDir, path.parse(tmpPath).name));
    }

    static msToTime(s) {
        const ms = s % 1000;
        s = (s - ms) / 1000;
        const secs = s % 60;
        s = (s - secs) / 60;
        const mins = s % 60;
        const hrs = (s - mins) / 60;

        function pad(n, z) {
            z = z || 2;
            return ('00' + n).slice(-z);
        }

        return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
    }

}

module.exports.Utils = Utils;
