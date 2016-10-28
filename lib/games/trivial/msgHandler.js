'use strict';

const questions = require('./questions.json');
const MsgHandlerBase = require('../base/msgHandlerBase');

class MgsHandler extends MsgHandlerBase {
    constructor(options) {
        super(options);
        this.commands = require('./commands.json');
        this.commandsBase = Object.assign(this.commandsBase, this.commands);
        this.event.on('game:start', this._GAME_START_EVENT_HANDLER.bind(this));
    }

    _sendQuestion() {
        let msg = new this.Msg();
        msg.data = {
            for: this._clients[this._connectionHandler.user.context].connection[this._clients[this._connectionHandler.user.context].game.turn].user.nick,
            question: questions[this._clients[this._connectionHandler.user.context].game.lastQuestion]
        };
        this._clients[this._connectionHandler.user.context].game.lastQuestion++;
        this._sendBroadCastMsg(JSON.stringify(msg));
    }

    _nextTurn() {
        if (this._connectionHandler.user.position === this._clients[this._connectionHandler.user.context].game.turns.length - 1) {
            this._clients[this._connectionHandler.user.context].game.turn = this._clients[this._connectionHandler.user.context].game.turns[0];
        } else {
            this._clients[this._connectionHandler.user.context].game.turn = this._clients[this._connectionHandler.user.context].game.turns[this._connectionHandler.user.position + 1];
        }
    }

    _GAME_START_EVENT_HANDLER() {
        this._resetTurn();
        this._sendQuestion();
    }

    _resetTurn() {
        let clients = Object.keys(this._clients[this._connectionHandler.user.context].connection);
        for (let id in clients) {
            this._clients[this._connectionHandler.user.context].game.responsePool[clients[id]] = {
                responsedOk: false,
                reaponsed: false
            };
        }
    }

    _calcResponse(id, responseOk) {
        if (this._clients[this._connectionHandler.user.context].game.responsePool[id].responsed) {
            throw Error('Can\'t respond many times, just one by turn');
        }

        this._clients[this._connectionHandler.user.context].game.responsePool[id].responsedOk = responseOk;
        this._clients[this._connectionHandler.user.context].game.responsePool[id].responsed = true;
        let responses = 0;
        for (let id in this._clients[this._connectionHandler.user.context].game.responsePool) {
            responses += (!this._clients[this._connectionHandler.user.context].game.responsePool[id].responsed) ? 1 : 0;
        }

        if (responseOk) {
            this._connectionHandler.user.score = responses * 10;
        }

        return (responses === 0);
    }

    _GAME_RESPOND(args) {
        // {questionNumber: 0, response: 3}
        super._GAME_RESPOND(args);

        let msg = new this.Msg(),
            allClientsResponded = false;

        if (questions[args.questionNumber].responses[args.response].right) {
            allClientsResponded = this._calcResponse(this._connectionHandler.user.id, true);
            msg.data = {
                nick: this._connectionHandler.user.nick,
                responseOk: true,
                currentScore: this._connectionHandler.user.score
            };
        } else {
            allClientsResponded = this._calcResponse(this._connectionHandler.user.id, false);
            msg.data = {
                nick: this._connectionHandler.user.nick,
                responseOk: false,
                currentScore: this._connectionHandler.user.score
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
