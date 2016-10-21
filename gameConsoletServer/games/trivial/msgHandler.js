'use strict';

const commands = require('./commands.json');
const msg = require('./msg');


class MgsHandler {
    constructor(options) {
        this._clients = options.clients;
        this._msgSanple = "{type: ['SYS'|'ACTION'], command:'', arguments: ['', '']}";
    }

    _parseMsg(params, arguments) {
        if (arguments.length > 0) {
            if (params[arguments[0]]) {
                this._parseMsg(params[arguments[0]], arguments.slice(1));
            } else {
                throw Error('Param not allowed ' + arguments[0]);
            }
        }
    }

    _sendBroadCastMsg(msg) {
        for (let id in this._clients) {
            this._clients[id].sendUTF(msg);
        }
    }

    process(connectionHandler, jsonStringMsg) {
        try {
            let msg = JSON.parse(jsonStringMsg);
            this._parseMsg(commands, msg);
        } catch (error) {
            connectionHandler.sendUTF(msg.ERROR(error.message));
            return false;
        }
        return true;
    }
}


module.exports = MgsHandler;
