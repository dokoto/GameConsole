'use strict';

const WebSocketClient = require('websocket').client;
const assert = require('assert');

const options = {
    numOfUsers: 5,
    wsUrl: 'http://localhost:8083',
    protocol: 'chat'
};

class Bot {
    constructor() {
        this.client = new WebSocketClient();
        this.connection = null;
    }

    onError(error) {
        throw Error(error);
    }

    onClose() {

    }

    onMessage(message) {

    }

    onConnectfailed(error) {
        throw Error(error);
    }

    onConnect(connection) {
        this.connection = connection;
        this.client.on('connectFailed', this.onConnectfailed.bind(this));
        this.client.on('error', this.onError.bind(this));
        this.client.on('close', this.onClose.bind(this));
        this.client.on('message', this.onMessage.bind(this));
    }

    static factory(numOfUsers) {
        let clients = [];
        for (let i = 0; i < numOfUsers; i++) {
            clients.push(new Bot());
        }
        return clients;
    }


    static connect(clients, wsUrl, protocol) {
        for (let i = 0; i < clients.length; i++) {
            clients[i].on('connect', clients[i].onConnect.bind(clients[i]));
            clients[i].connect(wsUrl, protocol);
        }
    }

    static start(clients) {
        let msg = {

        };
        clients[0].connection.sendUTF(JSON.stringify(msg));
    }
}

try {
    let clients = Bot.factory(options.numOfUsers);
} catch(error) {
    console.log(error);
}
