'use strict';

class Soccer {
    constructor() {
        this._port = 8002;
        this._protocol = 'chat';
        this._clients = [];
    }

    _originIsAllowed(origin) {
        return true;
    }

    _onMessage(message) {
        if (message.type === 'utf8') {
            console.log('[%d] Received UTF8 Message: %s', Date.now(), message.utf8Data);
            for (let id in this._clients) {
                this._clients[id].sendUTF(message.utf8Data);
            }
        } else if (message.type === 'binary') {
            console.log('[%d] Received Binary Message of %s bytes', Date.now(), message.binaryData.length);
            console.warn('[%d] NO Binary response definided', Date.now());
        }
    }

    _onClose(reasonCode, description) {
        delete this._clients[this.id];
        console.log('[%d] Peer %s %s disconnected.', Date.now(), this.remoteAddress, this.id);
    }

    onRequestListener(request) {
        if (!this._originIsAllowed(request.origin)) {
            request.reject();
            console.log('[%d] Connection from origin %s rejected.', Date.now(), request.origin);
            return;
        }

        try {
            var connection = request.accept(this._protocol, request.origin);
            connection.id = request.httpRequest.headers['sec-websocket-key'];
            console.log('[%d] Connection accepted from %s/%s %s ', Date.now(), connection.remoteAddress, request.resource, connection.id);
            this._clients[connection.id] = connection;

            connection.on('message', this._onMessage.bind(this));
            connection.on('close', this._onClose.bind(this));

        } catch (e) {
            console.error('[%d] ERROR : %s', Date.now(), e.message);
        }
    }
}


module.exports = Soccer;
