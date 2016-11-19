'use strict';


const assert = require('assert');
const EventEmitter = require('events');
const Chance = require('chance');
const Client = require('./client');
let Messages = require('./messages');


const options = {
    numOfUsers: 5,
    wsUrl: 'ws://192.168.77.94:8003/trivial',
    protocol: 'chat',
    room: '101'
};

class Clients extends EventEmitter {
    constructor(options) {
        super();
        this.chance = new Chance();
        this.options = options;
        this.clients = [];
    }

    factory() {
        for (let i = 0; i < this.options.numOfUsers; i++) {
            this.clients.push(new Client(this.chance.name()));
        }
    }

    errorHandler(error) {
        console.log('[TESTER][ERROR] %s', error.toString());
    }

    assertMessage(responseExpected, event, client, response) {
        try {
            assert.deepEqual(JSON.parse(response.utf8Data), responseExpected);
            console.log('[TESTER][SUCCESS] %s', event);
            this.emit(event);
        } catch (error) {
            console.log('[TESTER][ASSERT-ERROR][RESPONSE] %s', JSON.stringify(JSON.parse(response.utf8Data), null, '\t'));
            console.log('[TESTER][ASSERT-ERROR][EXPECTED] %s', JSON.stringify(responseExpected, null, '\t'));
        }
    }

    connect(index) {
        index = (index !== undefined) ? index + 1 : 0;
        if (index > 0) {
            console.log('[TESTER][CONNECT] "%s" connected OK', this.clients[index - 1].name);
        }
        if (index < this.clients.length) {
            this.clients[index].once('connected', this.connect.bind(this, index));
            this.clients[index].socket.once('connectFailed', this.errorHandler);
            this.clients[index].socket.once('connect', this.clients[index].onConnect.bind(this.clients[index]));
            this.clients[index].socket.connect(encodeURI(this.options.wsUrl + '?nick=' + this.clients[index].name), this.options.protocol);
        } else {
            this.emit('all:connected');
        }
    }

    create() {
        Messages.sent.create.arguments.room = this.options.room;
        this.clients[0].connection.sendUTF(JSON.stringify(Messages.sent.create));
        this.clients[0].once('message', this.assertMessage.bind(this, Messages.expected.standard, 'game:created'));
    }

    start() {
        Messages.sent.start.arguments.room = this.options.room;
        this.clients[0].connection.sendUTF(JSON.stringify(Messages.sent.start));
        this.clients[0].once('message', this.assertMessage.bind(this, Messages.expected.standard, 'game:started'));
    }

    join(index) {
        Messages.sent.join.arguments.room = this.options.room;
        index = (index !== undefined) ? index + 1 : 1;
        if (index > 1) {
            console.log('[TESTER][CONNECT] "%s" joined OK', this.clients[index - 1].name);
        }
        if (index < this.clients.length) {
            this.clients[index].connection.sendUTF(JSON.stringify(Messages.sent.join));
            this.once('client:joined', this.join.bind(this, index));
            this.clients[index].once('message', this.assertMessage.bind(this, Messages.expected.standard, 'client:joined'));
        } else {
            this.emit('all:joined');
        }
    }
}

try {
    let tester = new Clients(options);
    tester.factory();
    tester.connect();
    tester.on('all:connected', tester.create);
    tester.on('game:created', tester.join);
    tester.on('all:joined', tester.start);

} catch (error) {
    console.log(error);
}
