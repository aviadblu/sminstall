const path = require("path");
const {Utils} = require("./utils.service");
const {InstallService} = require("./install.service");
const {TarService} = require("./tar.service");
const {CliService} = require("./cli.service");

class SmartInstallService {

    constructor(targetFolder) {
        this.startTime = process.hrtime();
        this.stepCounter = 1;
        this.targetFolder = path.resolve(targetFolder);
        this.npmInstallFlag = false;
        this.mainCacheFolder = path.join(CliService.Options.foldersPath, "cache");
    }

    async createTmp() {
        this.tmpPath = await Utils.createTmpFolder();
    }

    async ensureCacheFolder() {
        this.logStep("ensureCacheFolder");
        await Utils.ensureDir(CliService.Options.foldersPath);
        const devStr = CliService.Options.hasOwnProperty("installDev") && CliService.Options.installDev ? "dev" : "";
        this.targetFolderHash = await Utils.hashFromString(this.targetFolder + devStr);
        this.cacheFolder = path.join(this.mainCacheFolder, this.targetFolderHash);
        return await Utils.ensureDir(this.cacheFolder);
    }

    async cleanCache() {
        const mainCacheFolderExist = await Utils.fileExists(this.mainCacheFolder);
        if (mainCacheFolderExist && CliService.Options.cacheClean) {
            this.logStep("Cleaning Cache");
            await Utils.deleteDir(this.mainCacheFolder);
        }
    }

    async cleanTmp() {
        return await Utils.cleanTmpFolders();
    }

    async init() {
        this.logStep("init");
        try {
            await this.cleanTmp();
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
        } catch (e) {
            return await Promise.reject(`Error: root path [${this.targetFolder}] is not an npm root!`);
        }

        try {
            this.createPackageJsonFileObject();
            this.hash = await Utils.hashFromString(JSON.stringify(this.generatedPackageFile));
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
            await this.createPackageJsonFile(tmpFolder);

            await InstallService.install(tmpFolder);
            await TarService.createTarBall(path.join(tmpFolder, "node_modules"), this.tarBallFile);
            this.npmInstallFlag = true;
        } catch (e) {
            return await Promise.reject(e);
        }
        return await Promise.resolve();
    }

    createPackageJsonFileObject() {
        let fileAsObj = {dependencies: this.packageFile.dependencies};
        if (CliService.Options.hasOwnProperty("installDev") && CliService.Options.installDev && this.packageFile.hasOwnProperty("devDependencies")) {
            console.log("Install with dev dependencies");
            fileAsObj.devDependencies = this.packageFile.devDependencies;
        }
        this.generatedPackageFile = fileAsObj;
    }

    async createPackageJsonFile(tmpFolder) {
        await Utils.createJson(path.join(tmpFolder, "package.json"), this.generatedPackageFile);
    }

    async cleanTargetModules() {
        this.logStep("cleanTargetModules");
        return await Utils.deleteDir(path.join(this.targetFolder, "node_modules"));
    }

    async extractTargetModules() {
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
                installDev: (CliService.Options.hasOwnProperty("installDev") && CliService.Options.installDev),
                runs: []
            };
        } else {
            this.infoFile = await Utils.getJson(this.infoFilePath);
        }

        const currRun = {
            npmInstall: this.npmInstallFlag,
            date: Date.now(),
            elapsed: elapsed
        };
        this.infoFile.runs.push(currRun);

        let sortCompare = (a, b) => {
            if (a.date > b.date) return 1;
            if (b.date > a.date) return -1;
            return 0;
        };

        if (this.infoFile.runs.length > 1) {
            let installRunsArray = this.infoFile.runs.filter(r => r.npmInstall).sort(sortCompare);
            if (installRunsArray.length > 0) {
                const lastInstallRun = installRunsArray[installRunsArray.length - 1];
                this.logResult(lastInstallRun, currRun);
            }
        }

        await Utils.createJson(this.infoFilePath, this.infoFile);

        return await Promise.resolve();
    }

    async clean() {
        return await new Promise(async resolve => {
            if(this.tmpPath) {
                await Utils.removeRunningProcesses(this.tmpPath);
            }
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

    logResult(lastInstallRun, currentInstallRun) {
        console.log(`\x1b[35m+++++++++++++++++++++++++++++++++++++++++++++++++++++++++\x1b[0m`);
        console.log(`Last full install: ${Utils.msToTime(lastInstallRun.elapsed)}`);
        console.log(`Current Sminstall: ${Utils.msToTime(currentInstallRun.elapsed)} (${(lastInstallRun.elapsed / currentInstallRun.elapsed).toFixed(1)} times faster)`);
        console.log(`Time saved: ${Utils.msToTime(lastInstallRun.elapsed - currentInstallRun.elapsed)}`);
        console.log(`\x1b[35m+++++++++++++++++++++++++++++++++++++++++++++++++++++++++\x1b[0m`);
    }
}


module.exports.SmartInstallService = SmartInstallService;
