'use strict';

const questions = require('./questions.json');
const MsgHandlerBase = require('../base/msgHandlerBase');

class MgsHandler extends MsgHandlerBase {
    constructor(options) {
        super(options);
        this.commands = require('./commands.json');
        this.commandsBase = Object.assign(this.commandsBase, this.commands);

        this.event.on('game:create', this._GAME_CREATE_EVENT_HANDLER.bind(this));
        this.event.on('game:start', this._GAME_START_EVENT_HANDLER.bind(this));
        this.event.on('game:join', this._GAME_JOIN_EVENT_HANDLER.bind(this));
    }

    _sendQuestion() {
        let msg = new this.Msg();
        msg.data = {
            for: this._game.rooms[this._conn.client.room].turn,
            question: questions[this._game[this._conn.profile.room].lastQuestion]
        };
        this._game[this._conn.profile.room].lastQuestion++;
        this._sendBroadCastMsg(JSON.stringify(msg));
    }

    _nextTurn() {
        if (this._conn.profile.position === this._game.rooms[this._conn.profile.room].turns.length - 1) {
            this._game.rooms[this._conn.profile.room].turn = this._game.rooms[this._conn.profile.room].turns[0];
        } else {
            this._game.rooms[this._conn.profile.room].turn = this._game.rooms[this._conn.profile.room].turns[this._conn.profile.position + 1];
        }
    }

    _GAME_CREATE_EVENT_HANDLER() {
    }

    _GAME_START_EVENT_HANDLER() {
        this._resetTurn();
        this._sendQuestion();
    }

    _GAME_JOIN_EVENT_HANDLER() {
    }

    _resetTurn() {
        this._game.rooms[this._conn.profile.room].responsePool = {};
        for (let nick in this._game.rooms[this._conn.profile.room].turns) {
            this._game.rooms[this._conn.profile.room].responsePool[nick] = {
                responsedOk: false,
                reaponsed: false
            };
        }
    }

    _calcResponse(nick, responseOk) {
        if (this._game.rooms[this._conn.profile.room].responsePool[nick].responsed) {
            throw Error('Can\'t respond many times, just one by turn');
        }

        this._game.rooms[this._conn.profile.room].responsePool[nick].responsedOk = responseOk;
        this._game.rooms[this._conn.profile.room].responsePool[nick].responsed = true;
        let responses = 0;
        for (let nick in this._game.rooms[this._conn.profile.room].responsePool) {
            responses += (!this._game.rooms[this._conn.profile.room].responsePool[nick].responsed) ? 1 : 0;
        }

        if (responseOk) {
            this._game.rooms[this._conn.profile.room].clients[this._conn.profile.nick].score = responses * 10;
        }

        return (responses === 0);
    }

    _GAME_RESPOND(args) {
        super._GAME_RESPOND(args);

        let msg = new this.Msg(),
            allClientsResponded = false;

        if (questions[args.questionNumber].responses[args.response].right) {
            allClientsResponded = this._calcResponse(this._conn.profile.id, true);
            msg.data = {
                nick: this._conn.profile.nick,
                responseOk: true,
                currentScore: this._game.rooms[this._conn.profile.room].clients[this._conn.profile.nick].score
            };
        } else {
            allClientsResponded = this._calcResponse(this._conn.profile.nick, false);
            msg.data = {
                nick: this._conn.profile.nick,
                responseOk: false,
                currentScore: this._game.rooms[this._conn.profile.room].clients[this._conn.profile.nick].score
            };
        }

        this._nextTurn();
        this._sendBroadCastMsg(JSON.stringify(msg));
        if (allClientsResponded) {
            this._resetTurn();
            this._sendQuestion();
        }
    }
}


module.exports = MgsHandler;
