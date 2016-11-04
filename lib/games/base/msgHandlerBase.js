'use strict';

const EventEmitter = require('events');
const request = require('request');

class MgsHandlerBase {
    constructor(options) {
        this._clients = options.clients;
        this._games = options.games;
        this._game = null;
        this._conn = null;
        this.commandsBase = require('./commandsBase.json');
        this.args = null;
        this.event = new EventEmitter();
        this.Msg = function() {
            return {
                status: 'success',
                msg: 'success',
                data: []
            };
        };
    }

    process(connectionHandler, jsonStringMsg) {
        try {
            this.args = JSON.parse(jsonStringMsg);
            this._parseMsg(this.commandsBase, this.args.command);
            this._conn = connectionHandler;
            this._game = this._games[this._conn.profile.context];
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

    _sendBroadCastMsg(msg) {
        for (let client in this._game[this._conn.client.room].clients) {
            client.sendUTF(msg);
        }
    }

    _checkTurn() {
        if (this._conn.client.nick !== this._games[this._conn.click.room].turn) {
            this.event.emit('game:not:your:turn', this._conn.client.nick);
        }
    }

    _execute() {
        this['_' + this.args.command.join('_')](this.args.arguments);
    }

    _SYS_LIST_USERS(args) {
        let connection = null,
            msg = new this.Msg();
        for (let nick in this._clients) {
            msg.data.push({
                'nick': this._clients[nick].profile.nick,
                'id': this._clients[nick].profile.id,
                'type': this._clients[nick].profile.type,
                'address': this._clients[nick].profile.address,
                'room': this._clients[nick].profile.room
            });
        }

        this._conn.sendUTF(JSON.stringify(msg));
        this.event.emit('sys:list:users');
    }

    _SYS_LIST_GAMES(args) {
        let msg = new this.Msg();
        let connection = null;
        for (let game in this._games) {
            msg.data.push({
                'game': game
            });
        }

        this._conn.sendUTF(JSON.stringify(msg));
        this.event.emit('sys:list:games');
    }

    _SYS_GET_SOURCES(args) {
        let msg = new this.Msg();
        request(args.url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                msg.data = body;
                this._conn.sendUTF(JSON.stringify(msg));
                this.event.emit('sys:get:sources');
            }
        }.bind(this));
    }

    _SYS_LIST_ROOMS(args) {
        let msg = new this.Msg();
        let connection = null;
        for (let room in this._game.rooms) {
            msg.data.push({
                'room': room
            });
        }

        this._conn.sendUTF(JSON.stringify(msg));
        this.event.emit('sys:list:rooms');
    }

    _GAME_SET_USER_NAME(args) {
        let msg = new this.Msg();

        let connection = null;
        for (let client in this._clients) {
            if (client.nick === args.nick) {
                throw Error('Nick : ' + args.nick + ' exist, please choose another one');
            }
        }
        this._conn.profile.nick = args.nick;
        this._conn.sendUTF(JSON.stringify(msg));
        this.event.emit('game:set:user_name');
    }

    _GAME_RESPOND(args) {
        this._checkTurn();
    }

    _GAME_START(args) {
        if (this._conn.profile.type !== 'owner') {
            throw Error('User must the game owner to start it');
        }

        let msg = new this.Msg();

        this._game[this._conn.user.room].started = true;
        this._game[this._conn.user.room].turn = this._conn.profile.nick;

        this.event.emit('game:start');
    }

    _GAME_CREATE(args) {
        let msg = new this.Msg();
        if (this._conn.profile.room) {
            let msg = new this.Msg();
            msg.status = 'error';
            msg.msg = 'You are joined in the room ' + this._conn.profile.room + ' .Only allowed joined one room at the same time';
            this._conn.sendUTF(JSON.stringify(msg));
        } else if (!args && !args.room && args.room.length === 0) {
            let msg = new this.Msg();
            msg.status = 'error';
            msg.msg = 'Room arg no found';
            this._conn.sendUTF(JSON.stringify(msg));
        } else if (this._game.rooms && this._game.rooms[args.room]) {
            let msg = new this.Msg();
            msg.status = 'error';
            msg.msg = 'Room ' + args.room + ' exist';
            this._conn.sendUTF(JSON.stringify(msg));
        } else {
            this._conn.profile.room = args.room;
            this._conn.profile.type = 'owner';
            this._conn.profile.position = 0;
            this._game.rooms[args.room] = {};
            this._game.rooms[args.room].turns = [];
            this._game.rooms[args.room].turns.push(this._conn.profile.nick);
            this._game.rooms[args.room].clients = {};
            this._game.rooms[args.room].clients[this._conn.profile.nick] = {
                score: 0
            };

            this.event.emit('game:create');
        }
    }

    _GAME_JOIN(args) {
        let msg = new this.Msg();
        if (this._conn.profile.room) {
            let msg = new this.Msg();
            msg.status = 'error';
            msg.msg = 'You are joined in the room ' + this._conn.profile.room + ' .Only allowed joined one room at the same time';
            this._conn.sendUTF(JSON.stringify(msg));
        } else if (!args && !args.room && args.room.length === 0) {
            let msg = new this.Msg();
            msg.status = 'error';
            msg.msg = 'Room arg no found';
            this._conn.sendUTF(JSON.stringify(msg));
        } else if (this._game.rooms && !this._game.rooms[args.room]) {
            let msg = new this.Msg();
            msg.status = 'error';
            msg.msg = 'Room ' + args.room + ' not found';
            this._conn.sendUTF(JSON.stringify(msg));
        } else if (this._game.rooms.length > 0 && this._game.turns.indexOf(this._conn.profile.nick) !== -1) {
            let msg = new this.Msg();
            msg.status = 'error';
            msg.msg = 'User ' + this._conn.profile.nick + ' exist in room ' + args.room;
            this._conn.sendUTF(JSON.stringify(msg));
        } else {
            this._conn.profile.type = 'user';
            this._conn.profile.position = Object.keys(this._game.rooms[args.room].clients).length;
            this._conn.profile.room = args.room;
            this._game.rooms[args.room].turns.push(this._conn.profile.nick);
            this._game.rooms[args.room].clients[this._conn.profile.nick] = {
                score: 0
            };
            this.event.emit('game:join');
        }
    }

}


module.exports = MgsHandlerBase;
