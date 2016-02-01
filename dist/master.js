"use strict";
/**
 * Class for running the worker
 */
var master = (function () {
    /**
     * Init
     * @param {string} aes_key - the aes key
     * @param {string} public_key - the public key
     * @param {string} private_key - the private key
     */
    function master(aes_key, public_key, private_key) {
        this.aes_key = aes_key;
        this.public_key = public_key;
        this.private_key = private_key;
        /**
         * The web worker for encryption
         * @type {Worker}
         */
        this._worker = new Worker('/dist/worker.js');
        /**
         * The id of the current command
         * @type {number}
         */
        this._id = 0;
        var aes_keyPromise = 1;
        var public_keyPromise = 1;
        var private_keyPromise = 1;
        if (aes_key) {
            aes_keyPromise = this.exec('set_aes_key', { aes_key: aes_key });
        }
        if (public_key) {
            public_keyPromise = this.exec('set_public_key', { public_key: public_key });
        }
        if (private_key) {
            private_keyPromise = this.exec('set_private_key', { private_key: private_key });
        }
    }
    /**
     * Send a command to the worker
     * @param {string} name - the name of the function to execute
     * @param {object} args - the args to send to the command
     * @return {Promise} a promise when the command is completed
     */
    master.prototype.exec = function (name, args) {
        var _this = this;
        if (args === void 0) { args = {}; }
        var id = ++this._id;
        this._worker.postMessage(JSON.stringify({ cmd: name, args: args, id: id }));
        return new Promise(function (resolve, reject) {
            _this._worker.onmessage = function (event) {
                var data = JSON.parse(event.data);
                if (data.id === id) {
                    resolve(data.rst);
                }
            };
        });
    };
    return master;
})();
