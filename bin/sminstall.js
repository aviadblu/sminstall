#!/usr/bin/env node
const fs = require("fs");
const {SmartInstallService} = require("../lib/smart-install.service");

async function Main() {
    let rootPath = ".";
    if (process.argv[2] && fs.existsSync(process.argv[2]))
        rootPath = process.argv[2];

    let smartInstallSvc = new SmartInstallService(rootPath);
    await smartInstallSvc.init();
    await smartInstallSvc.smartInstall();
}

Main();
