const path = require("path");
const {Utils} = require("./utils.service");
const {InstallService} = require("./install.service");
const {TarService} = require("./tar.service");

class SmartInstallService {

    constructor(targetFolder) {
        this.startTime = process.hrtime();
        this.stepCounter = 1;
        this.targetFolder = path.resolve(targetFolder);
    }

    async createTmp() {
        this.tmpPath = await Utils.createTmpFolder();
    }

    async ensureCacheFolder() {
        this.logStep("ensureCacheFolder");
        this.targetFolderHash = await Utils.hashFromString(this.targetFolder);
        this.cacheFolder = path.join(__dirname, "../cache", this.targetFolderHash);
        const targetFolderHashExist = await Utils.fileExists(this.cacheFolder);
        if (!targetFolderHashExist) {
            //console.log("New folder, first time installation");
        }
        return await Utils.ensureDir(this.cacheFolder);
    }

    async init() {
        this.logStep("init");
        try {
            await this.ensureCacheFolder();
            await this.readTarget();
        } catch (e) {
            return await Promise.reject(e);
        }
        return await Promise.resolve();
    }

    async readTarget() {
        this.logStep("readTarget");
        try {
            this.packageFile = await Utils.getJson(path.join(this.targetFolder, "package.json"));
        }
        catch (e) {
            return await Promise.reject(`Error: root path [${this.targetFolder}] is not an npm root!`);
        }

        try {
            this.hash = await Utils.hashFromString(JSON.stringify(this.packageFile.dependencies));
        } catch (e) {
            return await Promise.reject(e);
        }
        return await Promise.resolve();
    }

    async getTarBall() {
        this.logStep("getTarBall");
        const exsits = await this.checkIfCatchExists();
        if (!exsits) {
            await this.prepareNodeModules();
        }
        return await Promise.resolve(this.tarBallFile);
    }

    async checkIfCatchExists() {
        this.logStep("checkIfCatchExists");
        this.tarBallFile = path.join(this.cacheFolder, `${this.hash}.tar`);
        return await Utils.fileExists(this.tarBallFile);
    }

    async prepareNodeModules() {
        this.logStep("prepareNodeModules");
        try {
            await this.createTmp();
            const tmpFolder = path.join(this.tmpPath, this.hash);
            await Utils.ensureDir(tmpFolder);
            await Utils.createJson(path.join(tmpFolder, "package.json"), {dependencies: this.packageFile.dependencies});
            await InstallService.install(tmpFolder);
            await TarService.createTarBall(path.join(tmpFolder, "node_modules"), this.tarBallFile);
        } catch (e) {
            return await Promise.reject(e);
        }
        return await Promise.resolve();
    }

    async cleanTargetModules() {
        this.logStep("cleanTargetModules");
        return await Utils.deleteDir(path.join(this.targetFolder, "node_modules"));
    }

    async extractTargetModules() {
        this.logStep("extractTargetModules");
        try {
            await TarService.extractTarBall(this.tarBallFile, path.join(this.targetFolder, "node_modules"));
        } catch (e) {
            return await Promise.reject(e);
        }
        return await Promise.resolve();
    }

    async tearDown() {
        const phrtime = process.hrtime(this.startTime);
        const elapsedMS = phrtime[1] / 1000000;
        const elapsedS = phrtime[0];
        const elapseMSTotal = Math.ceil(elapsedS * 1000 + elapsedMS);
        try {
            await this.createHistoryRow(elapseMSTotal);
            await this.clean();
        } catch (e) {
            return await Promise.reject(e);
        }
        return await Promise.resolve();
    }

    async createHistoryRow(elapsed) {
        this.infoFilePath = path.join(this.cacheFolder, "info.json");
        const fEx = await Utils.fileExists(this.infoFilePath);
        if (!fEx) {
            this.infoFile = {
                path: this.targetFolder,
                hash: this.targetFolderHash,
                runs: []
            };
        } else {
            this.infoFile = await Utils.getJson(this.infoFilePath);
        }
        this.infoFile.runs.push({
            date: Date.now(),
            elapsed: elapsed
        });

        await Utils.createJson(this.infoFilePath, this.infoFile);

        return await Promise.resolve();
    }

    async clean() {
        return await new Promise(resolve => {
            this.tmpPath && Utils.cleanTmp(this.tmpPath);
            resolve();
        });
    }

    async smartInstall() {
        this.logStep("smartInstall");
        try {
            await this.getTarBall();
            await this.cleanTargetModules();
            await this.extractTargetModules();
            await this.tearDown();
        } catch (e) {
            return await Promise.reject(e);
        }
        return await Promise.resolve();
    }

    logStep(step) {
        console.log(`\x1b[32m#############\x1b[0m \x1b[47m\x1b[30m [${this.stepCounter}] ${step} \x1b[0m\x1b[40m \x1b[32m#############\x1b[0m`);
        this.stepCounter++;
    }
}


module.exports.SmartInstallService = SmartInstallService;
