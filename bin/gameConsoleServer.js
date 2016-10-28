#!/usr/bin/env node

'use strict';

const WebSocketServer = require('websocket').server;
const HttpServer = require('../lib/serverLogic/httpServer');
const path = require('path');

class ConsoleGameServer {
    constructor() {
        this._httpServer = null;
        this._wsServer = null;
        this._game = null;
        this._params = {};
    }

    _help() {
        console.log('**********************************************');
        console.log('Game Console Server');
        console.log('**********************************************');
        console.log('Use: gcs --game [game name] [game params]');
        console.log('Sample: $> gcs --game soccer');
    }

    _resolveParams() {
        if (process.argv.length <= 2) {
            this._help();
            return false;
        }

        if (process.argv.indexOf('--game') !== -1) {
            this._params.gameName = process.argv[process.argv.indexOf('--game') + 1];
            this._params.gameParams = process.argv.slice(process.argv.indexOf('--game') + 2);
            console.log(this._params.gameParams);
        }

        if (JSON.stringify(this._params) === '{}') {
            this._help();
            return false;
        } else {
            return true;
        }
    }
    _resolveGame() {
        try {
            let Game = require(path.join('../lib/games', this._params.gameName, '/game'));
            this._game = new Game({
                params: this._params.gameParams
            });

            if (this._params.gameParams.indexOf('--help') !== -1) {
                this._game.help();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Require game "%s" fail because: %s', this._params.gameName, error);
            return false;
        }
    }

    _configureServer() {
        this._httpServer = new HttpServer({
            port: this._game._port,
            gameName: this._params.gameName
        });
        this._httpServer.start();
        this._wsServer = new WebSocketServer({
            httpServer: this._httpServer.getServer(),
            autoAcceptConnections: false
        });
        this._wsServer.on('request', this._game.onRequestListener.bind(this._game));
    }

    start() {
        if (this._resolveParams() && this._resolveGame()) {
            this._configureServer();
        }
    }
}

new ConsoleGameServer().start();
