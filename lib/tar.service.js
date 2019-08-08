const fs = require("fs");
const tar = require('tar-fs');

class TarService {

    static createTarBall(sourceFolder, targetFile) {
        return new Promise((resolve, reject) => {
            try {
                tar.pack(sourceFolder, {
                    finish: () => {
                        resolve();
                    }
                }).pipe(fs.createWriteStream(targetFile));
            } catch (e) {
                reject(e);
            }
        });
    }

    static extractTarBall(tarFile, destination) {
        return new Promise((resolve, reject) => {
            try {
                let rs = fs.createReadStream(tarFile).pipe(tar.extract(destination, {
                    finish: () => {
                        resolve();
                        rs.end();
                    }
                }));
            } catch (e) {
                reject(e);
            }
        });
    }
}

module.exports.TarService = TarService;
