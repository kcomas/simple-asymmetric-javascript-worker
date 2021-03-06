
"use strict"

declare var Promise: any;

/**
 * Class for running the worker
 */
class master {

    /**
     * The web worker for encryption
     * @type {Worker}
     */
    private _worker:any = new Worker('/dist/worker.js');

    /**
     * The id of the current command
     * @type {number}
     */
    private _id:number = 0;

    /**
     * Init
     */
    constructor() {

    }

    /**
     * Send a command to the worker
     * @param {string} name - the name of the function to execute
     * @param {object} args - the args to send to the command
     * @return {Promise} a promise when the command is completed
     */
    exec(name:string, args:any={}): any {
        var id = ++this._id;
        this._worker.postMessage(JSON.stringify({cmd:name,args:args,id:id}));
        return new Promise((resolve,reject)=>{
            this._worker.onmessage = (event) => {
                var data = JSON.parse(event.data);
                if(data.id === id){
                    resolve(data.rst);
                }
            };
        });
    }

}

export default  master;
