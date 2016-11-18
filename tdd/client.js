'use strict';

const WebSocketClient = require('websocket').client;
const EventEmitter = require('events');

class Client extends EventEmitter {
    constructor(name) {
        super();
        this.name = name;
        this.socket = new WebSocketClient();
        this.connection = null;
    }

    onConnect(connection) {
        this.connection = connection;
        this.connection.on('connectFailed', (error) => this.emit('connectFailed', this, error));
        this.connection.on('error', (error) => this.emit('error', this, error));
        this.connection.on('close', () => this.emit('close', this));
        this.connection.on('message', (message) => this.emit('message', this, message));
        this.emit('connected');
    }
}

module.exports = Client;
