'use strict';

module.exports = {
    'expected': {
        'standard': {
            status: 'success',
            msg: 'success',
            data: []
        }
    },
    'sent': {
        'create': {
            'command': ['GAME', 'CREATE'],
            'arguments': {
                'room': ''
            }
        },
        'start': {
            'command': ['GAME', 'START'],
            'arguments': {
                'room': ''
            }
        },
        'join': {
            'command': ['GAME', 'JOIN'],
            'arguments': {
                'room': ''
            }
        }
    }
};
