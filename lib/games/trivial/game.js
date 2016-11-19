'use strict';

const MsgHandler = require('./MsgHandler');
const GameBase = require('../base/gameBase');

class Trivial extends GameBase {
    constructor(options) {
        super(options);
        this._port = 8003;
        this._name = 'trivial';
        this._games = {
            'trivial': {
                'clients': {}
            }
        };
        this._msgHandler = new MsgHandler({
            clients: this._games.trivial.clients,
            games: this._games
        });
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
        super._connectionManager(request, connection);
    }

}


module.exports = Trivial;
