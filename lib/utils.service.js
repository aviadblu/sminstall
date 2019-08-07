const fs = require("fs-extra");
const fss = require("fs");
const crypto = require("crypto");
const tmp = require("tmp");

let tmpCleanupMap = {};

class Utils {

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
                prefix: "smartinstall-tmp_",
                unsafeCleanup: true
            },async (err, path, cleanupCallback) => {
                if (err) {
                    reject(err);
                } else{
                    const hashKey = await Utils.hashFromString(path);
                    tmpCleanupMap[hashKey] = cleanupCallback;
                    resolve(path);
                }
            });
        }));
    }

    static async cleanTmp(path) {
        const hashKey = await Utils.hashFromString(path);
        if(tmpCleanupMap.hasOwnProperty(hashKey)) {
            tmpCleanupMap[hashKey]();
        }
        return await Promise.resolve();
    }

}

module.exports.Utils = Utils;
