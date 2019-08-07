const fs = require("fs");
const tarPack = require("tar-pack");

class TarService {
    static createTarBall(sourceFolder, targetFile) {
        return new Promise(((resolve, reject) => {
            let ws = fs.createWriteStream(targetFile);
            tarPack.pack(sourceFolder)
                .pipe(ws)
                .on('error', (err) => {
                    reject(err.stack);
                })
                .on('close', () => {
                    ws.end();
                    resolve();
                });
        }));
    }

    static extractTarBall(tarFile, destination) {
        return new Promise(((resolve, reject) => {
            let rs = fs.createReadStream(tarFile)
                .pipe(tarPack.unpack(destination, (err) => {
                    if (err) reject(err.stack);
                    else  {
                        rs.end();
                        resolve();
                    }
                }))
        }));
    }
}

module.exports.TarService = TarService;
