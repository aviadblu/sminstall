#!/usr/bin/env node
const {CliService} = require("../lib/cli.service");
const {SmartInstallService} = require("../lib/smart-install.service");

async function Main() {
    CliService.Parse(process.argv);
    if (!CliService.Options.root) {
        CliService.Options.root = "."
    }

    let smartInstallSvc = new SmartInstallService(CliService.Options.root);
    if (CliService.Options.cacheClean) {
        await smartInstallSvc.cleanCache();
    } else {
        await smartInstallSvc.init();
        await smartInstallSvc.smartInstall();
    }
}

Main();
