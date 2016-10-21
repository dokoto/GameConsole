'use strict';

const ifs = require('os').networkInterfaces();

class ServerListener {
    static listener(port, game) {
        let ip = Object.keys(ifs)
            .map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0])
            .filter(x => x)[0].address;
        console.log('[%d] Game Server Console "%s" listening on http://%s:%d', Date.now(), game, ip, port);
    }
}

module.exports = ServerListener;
