'use strict';

const sprintf = require("sprintf-js").sprintf;

class GameBase {
    constructor(options) {
        this._port = 8000;
        this._protocol = 'chat';
        this._games = {};
        this._options = options;
        this._name = 'BASE';
        this._msgHandler = null;
    }

    _originIsAllowed(origin) {
        return true;
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

    /*
     * ESTRUCTURAS DE CONTROL GLOBAL DE TODOS LOS JUEGOS
     * _game[contexto(nombre del juego)] : Se almacenan datos globales a todo el juego y a todas sus salas(rooms)
     * _game[context].clients[nick] = Se almacenan todos objetos connection por nick. Cada connection es tipo websockclient para comunicar con cada cliente
     * _game[context].rooms[] = Se almacen todos los datos de las salas del juego indicado por el contexto
     */

    _connectionManager(request, connection) {
        let msg = new this._msgHandler.Msg();
        connection.profile = {};
        connection.profile.nick = decodeURI(request.resource.substr(request.resource.indexOf('?') + 1).split('=')[1]);
        connection.profile.address = connection.remoteAddress.substr(connection.remoteAddress.lastIndexOf(':') + 1);
        connection.profile.id = request.httpRequest.headers['sec-websocket-key'] + connection.profile.address + connection.profile.nick;
        connection.profile.context = request.resource.substr(1, request.resource.indexOf('?') - 1);
        console.log('[%d][%s] User "%s" connected from %s', Date.now(), connection.profile.context, connection.profile.nick, connection.profile.address);


        if (this._games && this._games[connection.profile.context]) {
            if (this._games[connection.profile.context].clients && this._games[connection.profile.context].clients[connection.profile.nick]) {
                msg.msg = sprintf('[%d][%s] User %s exist in Game:%s Room: %s. NO JOINED!!', Date.now(), this._name, connection.profile.nick,
                    connection.profile.context, this._games[connection.profile.context].clients[connection.profile.nick].room);
                console.warn(msg.msg);
                msg.status = 'error';
                connection.sendUTF(JSON.stringify(msg));
            } else {
                this._games[connection.profile.context].rooms = {};
                this._games[connection.profile.context].clients[connection.profile.nick] = connection;
            }
            connection.games = this._games;
        } else {
            msg.status = 'error';
            msg.msg = sprintf('[%d][%s] Game [%s] no exist.', Date.now(), this._name, connection.profile.context);
            console.log(msg.msg);
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
            connection.on('close', this._onClose);

        } catch (e) {
            console.error('[%d] ERROR : %s', Date.now(), e.message);
            console.error(e.stack);
        }
    }

    _onClose(reasonCode, description) {
        console.log('[%d][%s] Peer %s %s disconnected.', Date.now(), this.profile.context, this.profile.address, this.profile.nick);
        delete this.games[this.profile.context].clients[this.profile.id];
    }
}


module.exports = GameBase;
