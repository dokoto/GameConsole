'use strict';

const commands = require('./commands.json');
const questions = require('./questions.json');


class MgsHandler {
    constructor(options) {
        this._clients = options.clients;
        this._msgSanple = "{command:[], arguments: ['', '']}";
        this._connectionHandler = null;
    }

    process(connectionHandler, jsonStringMsg) {
        try {
            let msg = JSON.parse(jsonStringMsg);
            this._parseMsg(commands, msg.command);
            this._connectionHandler = connectionHandler;
            this._execute(msg);
        } catch (error) {
            connectionHandler.sendUTF(JSON.stringify({
                'status': 'error',
                'msg': error.message,
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

    _execute(msg) {
        this['_' + msg.command.join('_')](msg.arguments);
    }

    _SYS_LIST_USERS(args) {
        let msg = {
            status: 'success',
            msg: 'OK',
            data: []
        };

        let connection = null;
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
    }

    _SYS_LIST_GAMES(args) {
        if (this._connectionHandler.user.type !== 'owner') {
            throw Error('User must be owner exec LIST GAMES');
        }

        let msg = {
            status: 'success',
            msg: 'OK',
            data: []
        };

        let connection = null;
        for (let game in this._clients) {
            msg.data.push({
                'game': game
            });
        }

        this._connectionHandler.sendUTF(JSON.stringify(msg));
    }

    _GAME_SET_USER_NAME(args) {
        let msg = {
            status: 'success',
            msg: 'OK',
            data: []
        };

        let connection = null;
        for (let client in this._clients[this._connectionHandler.user.context].connection) {
            connection = this._clients[this._connectionHandler.user.context].connection[client];
            if (connection.user.nick === args.nick) {
                throw Error('Nick : ' + args.nick + ' exist, please choose another one');
            }
        }
        this._connectionHandler.user.nick = args.nick;
        this._connectionHandler.sendUTF(JSON.stringify(msg));
    }

    _sendQuestion() {
        let msg = {
            status: 'success',
            msg: 'OK',
            data: {
                for: this._clients[this._connectionHandler.user.context].connection[this._clients[this._connectionHandler.user.context].game.turn].user.nick,
                question: questions[0]
            }
        };

        this._sendBroadCastMsg(JSON.stringify(msg));
    }

    _nextTurn() {
        if (this._connectionHandler.user.position === this._clients[this._connectionHandler.user.context].game.turns.length - 1) {
            this._clients[this._connectionHandler.user.context].game.turn = this._clients[this._connectionHandler.user.context].game.turns[0];
        } else {
            this._clients[this._connectionHandler.user.context].game.turn = this._clients[this._connectionHandler.user.context].game.turns[this._connectionHandler.user.position + 1];
        }

        this._sendQuestion();
    }

    _GAME_RESPOND(args) {
        // {questionNumber: 0, response: 3}
        if (this._connectionHandler.user.id !== this._clients[this._connectionHandler.user.context].game.turn) {
            throw Error('It\'s not your turn. Must response ' +
                this._clients[this._connectionHandler.user.context].connection[this._clients[this._connectionHandler.user.context].game.turn].user.nick);
        }

        let msg = {
            status: 'success',
            msg: 'OK',
            data: {}
        };

        if (questions[args.questionNumber].responses[args.response].right) {
            this._connectionHandler.user.score += 10;
            msg.data = {
                nick: this._connectionHandler.user.id,
                responseOk: true,
                currentScore: this._connectionHandler.user.score
            };
        } else {
            this._connectionHandler.user.score -= 10;
            msg.data = {
                nick: this._connectionHandler.user.id,
                responseOk: true,
                currentScore: this._connectionHandler.user.score
            };
        }

        this._sendBroadCastMsg(JSON.stringify(msg));
        this._nextTurn();
    }

    _GAME_START(args) {
        if (this._connectionHandler.user.type !== 'owner') {
            throw Error('User must the game owner to start it');
        }

        let msg = {
            status: 'success',
            msg: 'OK',
            data: []
        };

        this._clients[this._connectionHandler.user.context].game.started = true;
        this._clients[this._connectionHandler.user.context].game.turn = this._connectionHandler.user.id;
        this._sendQuestion();
    }
}


module.exports = MgsHandler;
