'use strict';

module.exports = {
    ERROR: (msg) => {
        return JSON.stringify({
            'error': msg
        });
    },
    SUCCESS: (msg) => {
        return JSON.stringify({
            'msg': msg
        });
    }
};
