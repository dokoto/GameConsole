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

    assertMessage(responseExpected, ev, checkcb, client, response) {
        try {
            checkcb(JSON.parse(response.utf8Data), responseExpected);
            //assert.deepEqual(JSON.parse(response.utf8Data), responseExpected);
            console.log('[TESTER][MESSAGE][OK] %s', ev);
            this.emit(ev);
        } catch (error) {
            console.log('[TESTER][MESSAGE][RESPONSE][ERROR] %s', JSON.stringify(JSON.parse(response.utf8Data), null, '\t'));
            console.log('[TESTER][MESSAGE][EXPECTED][ERROR] %s', JSON.stringify(responseExpected, null, '\t'));
        }
    }

    connect(index) {
        index = (index !== undefined) ? index + 1 : 0;
        if (index > 0) {
            console.log('[TESTER][CONNECT][OK] "%s" connected', this.clients[index - 1].name);
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
        let checkcb = (response, responseExpected) => {
            if (response.status !== responseExpected.status || response.msg !== responseExpected.msg) {
                throw Error('status or msg error');
            }
        };
        Messages.sent.create.arguments.room = this.options.room;
        this.clients[0].connection.sendUTF(JSON.stringify(Messages.sent.create));
        this.clients[0].once('message', this.assertMessage.bind(this, Messages.expected.standard, 'game:created', checkcb));
    }



    start() {
        let checkcb = (response, responseExpected) => {
            if (response.status !== responseExpected.status || response.msg !== responseExpected.msg) {
                throw Error('status or msg error');
            }
            if (!response.question.question || !response.question.responses) {
                throw Error('No question or responses');
            }
        };
        Messages.sent.start.arguments.room = this.options.room;
        this.clients[0].connection.sendUTF(JSON.stringify(Messages.sent.start));
        this.clients[0].once('message', this.assertMessage.bind(this, Messages.expected.standard, 'game:started', checkcb));
    }

    join(index) {
        let checkcb = (response, responseExpected) => {
            if (response.status !== responseExpected.status || response.msg !== responseExpected.msg) {
                throw Error('status or msg error');
            }
        };
        Messages.sent.join.arguments.room = this.options.room;
        index = (index !== undefined) ? index + 1 : 1;
        if (index > 1) {
            console.log('[TESTER][CONNECT][OK] "%s" joined', this.clients[index - 1].name);
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
