"use strict";
/**
 * Class for running the worker
 */
var master = (function () {
    /**
     * Init
     */
    function master() {
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
exports.default = master;
