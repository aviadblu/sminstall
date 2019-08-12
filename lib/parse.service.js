const path = require("path");
const existsSync = require("fs-extra").pathExistsSync;

class ParseService {
    static parse(argv) {
        let eat = function (i, args) {
            if (i <= args.length) {
                return args.splice(i + 1, 1).pop();
            }
        };

        let args = argv.slice(2);
        let root = null;
        let sminstallOptions = {targetRoot: null, foldersPath: path.resolve("c:/", "ProgramData", "Sminstall")};

        let sminstallOpt = ParseService.sminstallOption.bind(null, sminstallOptions);
        let lookForArgs = true;

        // move forward through the arguments
        for (let i = 0; i < args.length; i++) {
            // if the argument looks like a file, then stop eating
            if (!root) {
                if (args[i] === '.' || existsSync(args[i])) {
                    root = path.resolve(args.splice(i, 1).pop());
                    sminstallOptions.targetRoot = i;
                    i--;
                    continue;
                }
            }

            if (lookForArgs) {
                // respect the standard way of saying: hereafter belongs to my root
                if (args[i] === '--') {
                    args.splice(i, 1);
                    sminstallOptions.targetRoot = i;
                    // cycle back one argument, as we just ate this one up
                    i--;

                    // ignore all further sminstall arguments
                    lookForArgs = false;

                    // move to the next iteration
                    continue;
                }

                if (sminstallOpt(args[i], eat.bind(null, i, args)) !== false) {
                    args.splice(i, 1);
                    // cycle back one argument, as we just ate this one up
                    i--;
                }
            }
        }

        sminstallOptions.root = root;
        sminstallOptions.args = args;

        return sminstallOptions;
    }

    static sminstallOption(options, arg, eatNext) {
        // line separation on purpose to help legibility
        if (arg === '--help' || arg === '-h' || arg === '-?') {
            let help = eatNext();
            options.help = help ? help : true;
        } else if (arg === '--foldersPath' || arg === '-fp') {
            options.foldersPath = eatNext();
        } else if (arg === '--dev' || arg === '-de') {
            options.installDev = true;
        } else if (arg === '--clean' || arg === '-cl') {
            options.cacheClean = true;
        } else {
            return false;
        }
    }
}

module.exports.ParseService = ParseService;
