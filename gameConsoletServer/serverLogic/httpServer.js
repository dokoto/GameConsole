'use strict';

const http = require('http');
const ServerListener = require('./serverListener');

class HttpServer {
    constructor(options) {
        this._server = null;
        this._port = options.port;
        this._gameName = options.gameName;
    }

    start() {
        this._server = http.createServer(this._requestListener.bind(this));
        this._server.listen(this._port, ServerListener.listener.bind(this, this._port, this._gameName));
    }

    getServer() {
        return this._server;
    }

    _requestListener(request, response) {
        console.log('[%d] Received request for %s', Date.now(), request.url);
        response.writeHead(404);
        response.end();
    }
}

module.exports = HttpServer;
