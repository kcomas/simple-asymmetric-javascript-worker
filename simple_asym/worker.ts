
"use strict"

/**
 * Error for missing aes key
 * @type {Error}
 */
var MissingAESException = new Error('Missing AES key. Set or generate one');

/**
 * Error for missing public key
 * @type {Error}
 */
var MissingRSAPublicException = new Error('Missing public RSA key. Set or generate one to use RSA encryption');

/**
 * Error for missing private key
 * @type {Error}
 */
var MissingRSAPrivateException = new Error('Missing private RSA key. Set or generate one to use RSA decrypt');

/**
 * The node forge class
 * @type {forge}
 */
declare var forge: any;
importScripts('/dist/lib/forge.bundle.js');

/**
 * The fernet class
 * @type {fernet}
 */
declare var fernet: any;
importScripts('/dist/lib/fernetBrowser.js');

/**
 * The object for returning the keys and passpharse
 * @property {string} private_key - as a pem string
 * @property {string} public_key - as a pem string
 * @property {string} passphrase - the password for the private key
 */
interface keyObj {
    private_key?:string,
    public_key?:string,
    passphrase?:string
}

/**
 * The lock to keep commands executing in order
 * @type boolean
 */
var lock: boolean = false;

declare function postMessage(args:any): any;
/**
 * Post a message back to the master
 * @param {string} name - the name of the arg executed
 * @param {object} rst - the result of the function
 * @param {number} id - the timestamp of the command
 */
var post = (name:string, rst:any, id:Number) => {
    lock = false;
    if(typeof rst !== 'object'){
        rst = {status:rst};
    }
    postMessage(JSON.stringify({cmd:name,rst:rst,id:id}));
};

/**
 * The worker thread
 */
class AsymCrypt {

    /**
     * The private key
     * @type {pki}
     */
    private _private_key: any;

    /**
     * The public key
     * @type {pki}
     */
    private _public_key: any;

    /**
     * The aes key
     * @type {string}
     */
    private _aes_key: string;

    /**
     * Init
     */
    constructor(){

    }
    
    /**
     * Generate a fernet key
     * @return {string} the base64 encoded key
     */
    private _generate_key(): string {
        var bytes = forge.random.getBytesSync(32);
        return forge.util.encode64(bytes);
    }

    /**
     * Generate a random passpharse
     * @param {number} N - the size of the passphrase defaults to 255
     */
    private _generate_passphrase(N:number=255): string {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for(var i = 0; i < N; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    /**
     * Get the public key as a pem file
     * @return {object(public_key:string)} - the key as a pem file
     */
    public_key(args:any): any {
        return {public_key:forge.pki.publicKeyToPem(this._public_key)};
    }

    /**
     * Get the private key as a pem file
     * @property {string} passphrase - the passphrase to encrypt the private key with
     * @return {object(private_key:string)} - the key as a pem file
     */
    private_key(args:any): any {
        if(args.passphrase){
            return {private_key:forge.pki.encryptRsaPrivateKey(this._private_key,args.passphrase)};
        } else {
            return {private_key:forge.pki.privateKeyToPem(this._private_key)};
        }
    }

    /**
     * Set the private key
     * @property {string|object} private_key - the private key as a pki object or pem string
     * @property {string} passphrase - the passphrase if any to decrypt the private key
     */
    set_private_key(args:any): boolean {
        if(args.passphrase){
            this._private_key = forge.pki.decryptRsaPrivateKey(args.private_key,args.passphrase);
        } else if(typeof args.private_key === 'string'){
            this._private_key = forge.pki.privateKeyFromPem(args.private_key);
        } else {
            this._private_key = args.private_key;
        }
        return true;
    }

    /**
     * Set the public key
     * @property {string} public_key - the public key as a pki object or pem string
     */
    set_public_key(args:any): boolean {
        if(typeof args.public_key === 'string'){
            this._public_key = forge.pki.publicKeyFromPem(args.public_key)
        } else {
            this._public_key = args.public_key;
        }
        return true;
    }

    /**
     * Generate the public and private keys
     * @property {string} passphrase - the password to encrypt the private key with
     * @property {number} bits - the bit size defaults to 2048
     * @return {object(private_key:string, public_key:string)} returns the public and private keys as a pem string
     */
    make_rsa_keys(args:any): any{
        if(!args.bits){
            args.bits = 4096;
        }
        var keypair = forge.rsa.generateKeyPair({ bits: args.bits, e: 0x10001 });
        this._private_key = keypair.privateKey;
        this._public_key = keypair.publicKey;
        var obj:keyObj = {};
        obj.public_key = forge.pki.publicKeyToPem(keypair.publicKey);
        if (args.passphrase) {
            obj.private_key = forge.pki.encryptRsaPrivateKey(keypair.privateKey, args.passphrase);
        } else {
            obj.private_key = forge.pki.privateKeyToPem(keypair.privateKey);
        }
        return obj;
    }

    /**
     * Wrapper for making the public and private keys with an auto generated passphrase
     * @property {number} bits - the bit size defaults to 2048
     */
    make_rsa_keys_with_passphrase(args:any): any {
        if(!args.bits){
            args.bits = 4096;
        }
        var passphrase = this._generate_passphrase();
        var obj:keyObj = this.make_rsa_keys({passphrase:passphrase,bits:args.bits});
        obj.passphrase = passphrase;
        return obj;
    }

    /**
     * Set the aes key
     * @property {string} aes_key - the new aes key
     * @return {boolean} the operation was completed
     */
    set_aes_key(args:any): boolean {
        this._aes_key = args.aes_key;
        return true;
    }

    /**
     * Generate the aes key
     * @return {object(aes_key:string)} the aes key as base64
     */
    make_aes_key(args:any): any {
        var key = this._generate_key();
        this.set_aes_key({aes_key:key});
        return {aes_key:key};
    }

    /**
     * Get the encrypted aes key from a public key
     * @property {string} public_key - the public key as a pem string
     * @property {boolean} use_base64 - encode the aes key as base64
     * @return {string} the encrypted aes key
     */
     get_encrypted_aes_key(args:any): any {
        var public_asym = new AsymCrypt();
        public_asym.set_public_key({public_key:args.public_key});
        var encrypted_key = public_asym.rsa_encrypt({text:this._aes_key});
        if(args.use_base64){
            encrypted_key.ciphertext = forge.util.encode64(encrypted_key.ciphertext);
        }
        return {encrypted_key:encrypted_key.ciphertext};
     }

     /**
      * Set the aes key from an encrypted string
      * @property {string} aes_key - the encrypted aes key
      * @property {boolean} use_base64 - if the aes key is base 64 encoded
      */
     set_aes_key_from_encrypted(args:any): boolean {
        if(args.use_base64){
            args.aes_key = forge.util.decode64(args.aes_key);
        }
        var text = this.rsa_decrypt({ciphertext:args.aes_key});
        this.set_aes_key({aes_key:text.text});
        return true;
     }

     /**
      * Encrypt plain text with the public key
      * @property {string} text - the text to encrypt
      * @property {boolean} use_base64 - encode the encrypted text as base64
      * @return {object(ciphertext:string)} - the encrypted text
      */
     rsa_encrypt(args:any): any {
        if(!this._public_key){
            throw MissingRSAPublicException;
            return false;
        }
        var encrypted = this._public_key.encrypt(args.text, 'RSA-OAEP', {
            mgf1: {
                md: forge.md.sha1.create()
            }
        });
        if(args.use_base64){
            encrypted = forge.util.encode64(encrypted); 
        }
        return {ciphertext:encrypted};
     }

     /**
      * Decrypt encrypted text witht the private key
      * @property {string} ciphertext - the text to decrypt
      * @property {boolean} use_base64 - if the text is encoded as base64
      * @return {object(text:string)} - the decrypted text
      */
     rsa_decrypt(args:any): any {
        if(!this._private_key){
            throw MissingRSAPrivateException;
            return false;
        }
        if(args.use_base64){
            args.ciphertext = forge.util.decode64(args.ciphertext);
        }
        var text = this._private_key.decrypt(args.ciphertext, 'RSA-OAEP',{
            mgf1: {
                md: forge.md.sha1.create()
            }
        });
        return {text:text};
     }

     /**
      * Encrypt text using aes encryption
      * @property {string} text - the text to encrypt
      * @return {object(ciphertext:string} the encrypted text
      */
     encrypt(args:any): any {
        if(!this._aes_key){
            throw MissingAESException;
            return false;
        }
        var token = new fernet.Token({
            secret: new fernet.Secret(this._aes_key),
        });
        return {ciphertext:token.encode(args.text)};
     }

     /**
      * Decrypt text using aes encryption
      * @property {string} ciphertext - the text to decrypt
      * @return {object(text:string)} the decrypted text
      */
     decrypt(args:any): any {
        if(!this._aes_key){
            throw MissingAESException;
            return false;
        }
        var token = new fernet.Token({
            secret: new fernet.Secret(this._aes_key),
            token: args.ciphertext,
            ttl: 0
        });
        return {text:token.decode()};
     }

}

/**
 * The worker command queue
 * @type {array}
 */
var queue = [];

/**
 * The main asymcrypt class for the worker
 */
var crypt = new AsymCrypt();

onmessage = (event)=> {
    queue.push(JSON.parse(event.data));
}

var waitLoop = () => {
    setTimeout(()=>{
        if(queue.length > 0 && !lock){
            var action = queue.shift();
            lock = true;
            var id = action.id;
            var rst = crypt[action.cmd](action.args);
            post(action.cmd,rst,id);
        }
        waitLoop();
    },100);
};

waitLoop();
