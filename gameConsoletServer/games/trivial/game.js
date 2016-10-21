'use strict';

const MsgHandler = require('./MsgHandler');

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

    _onMessage(connection, message) {
        if (message.type === 'utf8') {
            console.log('[%d][%s] Received UTF8 Message: %s', Date.now(), this._name, message.utf8Data);
            this._msgHandle.process(connection, message.utf8Data);            
        } else if (message.type === 'binary') {
            console.warn('[%d][%s] Received Binary Message of %s bytes', Date.now(), this._name, message.binaryData.length);
            console.warn('[%d][%s] NO Binary response definided', Date.now(), this._name);
        }
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

    _connectionManager(request, connection) {
        connection.user = {};
        connection.user.id = request.httpRequest.headers['sec-websocket-key'] + connection.remoteAddress;
        connection.user.address = connection.remoteAddress;
        connection.user.context = request.resource;
        if (this._clients && this._clients[connection.user.context]) {
            if (this._clients[connection.user.context][connection.user.id]) {
                console.warn('[%d][%s] User %s exist in %s NO JOINED!!', Date.now(), this._name, connection.remoteAddress, request.resource);
            } else {
                console.log('[%d][%s] New user %s joined to %s', Date.now(), this._name, connection.remoteAddress, request.resource);
                connection.user.type = 'user';
                this._clients[connection.user.context][connection.user.id] = connection;
            }
        } else {
            console.log('[%d][%s] New topic [%s] created. User %s setted as owner ', Date.now(), this._name, request.resource, connection.remoteAddress);
            connection.user.type = 'owner';
            this._clients[connection.user.context] = {};
            this._clients[connection.user.context][connection.user.id] = connection;
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
