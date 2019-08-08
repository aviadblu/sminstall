const {ParseService} = require('./parse.service');

let Options = null;

class CliService {

    static stringToArgs(string) {
        let args = [];

        let parts = string.split(' ');
        let length = parts.length;
        let i = 0;
        let open = false;
        let grouped = '';
        let lead = '';

        for (; i < length; i++) {
            lead = parts[i].substring(0, 1);
            if (lead === '"' || lead === '\'') {
                open = lead;
                grouped = parts[i].substring(1);
            } else if (open && parts[i].slice(-1) === open) {
                open = false;
                grouped += ' ' + parts[i].slice(0, -1);
                args.push(grouped);
            } else if (open) {
                grouped += ' ' + parts[i];
            } else {
                args.push(parts[i]);
            }
        }

        return args;
    }

    static Parse(argv) {
        if (typeof argv === 'string') {
            argv = CliService.stringToArgs(argv);
        }
        Options = ParseService.parse(argv);
    }

    static get Options() {
        return Options;
    }

}


module.exports.CliService = CliService;
