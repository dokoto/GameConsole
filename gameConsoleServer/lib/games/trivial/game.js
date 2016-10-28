'use strict';

const MsgHandler = require('./MsgHandler');
const sprintf = require("sprintf-js").sprintf;

class Trivial {
    constructor(options) {
        this._port = 8003;
        this._protocol = 'chat';
        this._clients = [];
        this._options = options;
        this._name = 'TRIVIAL';
        this._msgHandler = new MsgHandler({
            clients: this._clients
        });
    }

    _originIsAllowed(origin) {
        return true;
    }

    help() {
        console.log('');
        console.log('');
        console.log('----------------------------------------------');
        console.log('Trivial');
        console.log('----------------------------------------------');
        console.log('Use: gcs --game trivial [trivial params]');
        console.log('Sample: $> gcs --game trivial --maxclients 5');
        console.log('--maxclients : ');
    }

    _onMessage(connection, message) {
        if (message.type === 'utf8') {
            console.log('[%d][%s] Received UTF8 Message: %s', Date.now(), this._name, message.utf8Data);
            this._msgHandler.process(connection, message.utf8Data);
        } else if (message.type === 'binary') {
            console.warn('[%d][%s] Received Binary Message of %s bytes', Date.now(), this._name, message.binaryData.length);
            console.warn('[%d][%s] NO Binary response definided', Date.now(), this._name);
        }
    }

    _connectionManager(request, connection) {
        let msg = {
            status: 'success',
            msg: 'OK',
            data: []
        };
        connection.user = {};
        connection.user.nick = request.resource.substr(request.resource.indexOf('?')+1).split('=')[1];
        connection.user.score = 0;
        connection.user.id = request.httpRequest.headers['sec-websocket-key'] + connection.remoteAddress;
        connection.user.address = connection.remoteAddress;
        connection.user.context = request.resource.substr(0, request.resource.indexOf('?'));
        if (this._clients && this._clients[connection.user.context]) {
            if (this._clients[connection.user.context].connection[connection.user.id]) {
                msg.msg = sprintf('[%d][%s] User %s exist in %s NO JOINED!!', Date.now(), this._name, connection.user.nick, connection.user.context);
                console.warn(msg.msg);
                msg.status = 'warn';
                connection.sendUTF(JSON.stringify(msg));
            } else {
                if (this._clients[connection.user.context].game.started) {
                    msg.msg = sprintf('[%d][%s] Game %s has started no more user will be accepted', Date.now(), this._name);
                    console.log(msg.msg);
                    msg.status = 'warn';
                    connection.sendUTF(JSON.stringify(msg));
                } else {
                    msg.msg = sprintf('[%d][%s] New user %s joined to %s', Date.now(), this._name, connection.user.nick, connection.user.context);
                    console.log(msg.msg);
                    connection.user.type = 'user';
                    this._clients[connection.user.context].game.turns.push(connection.user.id);
                    connection.user.position = this._clients[connection.user.context].game.turns.length - 1;
                    this._clients[connection.user.context].connection[connection.user.id] = connection;
                    this._msgHandler._sendBroadCastMsg(JSON.stringify(msg), connection);
                }
            }
        } else {
            msg.msg = sprintf('[%d][%s] New topic [%s] created. User %s setted as owner ', Date.now(), this._name, connection.user.context, connection.user.nick);
            console.log(msg.msg);
            connection.user.type = 'owner';
            this._clients[connection.user.context] = {};
            this._clients[connection.user.context].connection = {};
            connection.user.position = 0;
            this._clients[connection.user.context].connection[connection.user.id] = connection;
            this._clients[connection.user.context].game = {};
            this._clients[connection.user.context].game.started = false;
            this._clients[connection.user.context].game.lastQuestion = 0;
            this._clients[connection.user.context].game.turns = [];
            this._clients[connection.user.context].game.turns.push(connection.user.id);
            connection.sendUTF(JSON.stringify(msg));
        }
    }

    onRequestListener(request) {
        if (!this._originIsAllowed(request.origin)) {
            request.reject();
            console.log('[%d][%s] Connection from origin %s rejected.', Date.now(), this._name, request.origin);
            return;
        }

        try {
            let connection = request.accept(this._protocol, request.origin);
            this._connectionManager(request, connection);
            connection.on('message', this._onMessage.bind(this, connection));
            connection.on('close', this._onClose.bind(this));

        } catch (e) {
            console.error('[%d] ERROR : %s', Date.now(), e.message);
        }
    }

    _onClose(reasonCode, description) {
        delete this._clients[this.user.id];
        console.log('[%d][%s] Peer %s %s disconnected.', Date.now(), this._name, this.remoteAddress, this.user.id);
    }
}


module.exports = Trivial;
