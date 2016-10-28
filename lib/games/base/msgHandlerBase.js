'use strict';

const EventEmitter = require('events');

class MgsHandlerBase {
    constructor(options) {
        this._clients = options.clients;
        this._msgSanple = "{command:[], arguments: ['', '']}";
        this._connectionHandler = null;
        this.commandsBase = require('./commandsBase.json');
        this.args = null;
        this.event = new EventEmitter();
        this.Msg = function() {
            return {
                status: 'success',
                msg: 'All things completed successful',
                data: []
            };
        };
    }

    process(connectionHandler, jsonStringMsg) {
        try {
            this.args = JSON.parse(jsonStringMsg);
            this._parseMsg(this.commandsBase, this.args.command);
            this._connectionHandler = connectionHandler;
            this._execute();
        } catch (error) {
            connectionHandler.sendUTF(JSON.stringify({
                'status': 'error',
                'msg': error.message,
                'stack': error.stack,
                data: []
            }));
            return false;
        }
        return true;
    }

    _parseMsg(params, args) {
        if (args.length > 0) {
            if (params[args[0]]) {
                this._parseMsg(params[args[0]], args.slice(1));
            } else {
                throw Error('Param not allowed ' + args[0]);
            }
        }
    }

    _sendBroadCastMsg(msg, connection) {
        let conn = this._connectionHandler || connection;
        for (let id in this._clients[conn.user.context].connection) {
            this._clients[conn.user.context].connection[id].sendUTF(msg);
        }
    }

    _checkTurn() {
        if (this._connectionHandler.user.id !== this._clients[this._connectionHandler.user.context].game.turn) {
            this.event.emit('game:not:your:turn', this._clients[this._connectionHandler.user.context].connection[this._clients[this._connectionHandler.user.context].game.turn].user.nick);
        }
    }

    _execute() {
        this['_' + this.args.command.join('_')](this.args.arguments);
    }

    _SYS_LIST_USERS(args) {
        let connection = null,
            msg = new this.Msg();
        for (let client in this._clients[this._connectionHandler.user.context].connection) {
            connection = this._clients[this._connectionHandler.user.context].connection[client];
            msg.data.push({
                'nick': connection.user.nick,
                'client': connection.user.id,
                'type': connection.user.type,
                'address': connection.user.address,
                'score': connection.user.score
            });
        }

        this._connectionHandler.sendUTF(JSON.stringify(msg));
        this.event.emit('sys:list:users');
    }

    _SYS_LIST_GAMES(args) {
        if (this._connectionHandler.user.type !== 'owner') {
            throw Error('User must be owner exec LIST GAMES');
        }

        let msg = new this.Msg();
        let connection = null;
        for (let game in this._clients) {
            msg.data.push({
                'game': game
            });
        }

        this._connectionHandler.sendUTF(JSON.stringify(msg));
        this.event.emit('sys:list:games');
    }

    _GAME_SET_USER_NAME(args) {
        let msg = new this.Msg();

        let connection = null;
        for (let client in this._clients[this._connectionHandler.user.context].connection) {
            connection = this._clients[this._connectionHandler.user.context].connection[client];
            if (connection.user.nick === args.nick) {
                throw Error('Nick : ' + args.nick + ' exist, please choose another one');
            }
        }
        this._connectionHandler.user.nick = args.nick;
        this._connectionHandler.sendUTF(JSON.stringify(msg));
        this.event.emit('game:set:user_name');
    }

    _GAME_RESPOND(args) {
        this._checkTurn();
    }

    _GAME_START(args) {
        if (this._connectionHandler.user.type !== 'owner') {
            throw Error('User must the game owner to start it');
        }

        let msg = new this.Msg();

        this._clients[this._connectionHandler.user.context].game.started = true;
        this._clients[this._connectionHandler.user.context].game.turn = this._connectionHandler.user.id;
        this.event.emit('game:start');
    }


}


module.exports = MgsHandlerBase;
