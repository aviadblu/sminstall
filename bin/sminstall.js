#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const {SmartInstallService} = require("../lib/smart-install.service");

async function Main() {
    let rootPath = null;
    if (process.argv[2]) {
        const dirFromArgs = process.argv[2].toString()
        if(fs.existsSync(dirFromArgs)){
            rootPath = dirFromArgs;
        }
        else {
            console.log(`Root path is not a folder: '${path.resolve(dirFromArgs)}'`);
        }
    } else {
        rootPath = "."
    }

    if(rootPath != null) {
        let smartInstallSvc = new SmartInstallService(rootPath);
        await smartInstallSvc.init();
        await smartInstallSvc.smartInstall();
    } else {
        console.log("Exit");
    }
}

Main();
