'use strict';

const Connect = require('./test/connect');
const WebSocketClient = require('websocket').client;
var assert = require('assert');



describe("Trivial Game", function() {
    //let connect = new Connect();
    //connect.doConnection('ws://10.80.80.50:8003/trivial?nick=', 'dokoto', 'chat');
    it('Should create a new connection for dokoto', function(done) {
        var client = new WebSocketClient();
        client.connect('ws://10.80.80.50:8003/trivial?nick=dokoto', 'chat');
        client.on('connect', function() {
            assert.ok(true);
        });
        client.on('connectFailed', function(error) {
            assert.ok(false, error);
        });
    });
});
