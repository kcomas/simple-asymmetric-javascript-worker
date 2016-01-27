"use strict";
importScripts('/dist/lib/forge.bundle.js');
importScripts('/dist/lib/fernetBrowser.js');
/**
 * The lock to keep commands executing in order
 * @type boolean
 */
var lock = false;
/**
 * Post a message back to the master
 * @param {string} name - the name of the arg executed
 * @param {object} rst - the result of the function
 * @param {number} id - the timestamp of the command
 */
var post = function (name, rst, id) {
    lock = false;
    if (typeof rst !== 'object') {
        rst = { status: rst };
    }
    postMessage(JSON.stringify({ cmd: name, rst: rst, id: id }));
};
/**
 * The worker thread
 */
var AsymCrypt = (function () {
    /**
     * Init
     */
    function AsymCrypt() {
    }
    /**
     * Generate a fernet key
     * @return {string} the base64 encoded key
     */
    AsymCrypt.prototype._generate_key = function () {
        var bytes = forge.random.getBytesSync(32);
        return forge.util.encode64(bytes);
    };
    /**
     * Generate a random passpharse
     * @param {number} N - the size of the passphrase defaults to 255
     */
    AsymCrypt.prototype._generate_passphrase = function (N) {
        if (N === void 0) { N = 255; }
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < N; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };
    /**
     * Get the public key as a pem file
     * @return {object(public_key:string)} - the key as a pem file
     */
    AsymCrypt.prototype.public_key = function (args) {
        return { public_key: forge.pki.publicKeyToPem(this._public_key) };
    };
    /**
     * Get the private key as a pem file
     * @return {object(private_key:string)} - the key as a pem file
     */
    AsymCrypt.prototype.private_key = function (args) {
        return { private_key: forge.pki.privateKeyToPem(this._private_key) };
    };
    /**
     * Set the private key
     * @property {string|object} private_key - the private key as a pki object or pem string
     * @property {string} passphrase - the passphrase if any to decrypt the private key
     */
    AsymCrypt.prototype.set_private_key = function (args) {
        if (args.passphrase) {
            this._private_key = forge.pki.decryptRsaPrivateKey(args.private_key, args.passphrase);
        }
        else if (typeof args.private_key === 'string') {
            this._private_key = forge.pki.privateKeyFromPem(args.private_key);
        }
        else {
            this._private_key = args.private_key;
        }
        return true;
    };
    /**
     * Set the public key
     * @property {string} public_key - the public key as a pki object or pem string
     */
    AsymCrypt.prototype.set_public_key = function (args) {
        if (typeof args.public_key === 'string') {
            this._public_key = forge.pki.publicKeyFromPem(args.public_key);
        }
        else {
            this._public_key = args.public_key;
        }
        return true;
    };
    /**
     * Generate the public and private keys
     * @property {string} passphrase - the password to encrypt the private key with
     * @property {number} bits - the bit size defaults to 2048
     * @return {object(private_key:string, public_key:string)} returns the public and private keys as a pem string
     */
    AsymCrypt.prototype.make_rsa_keys = function (args) {
        if (!args.bits) {
            args.bits = 2048;
        }
        var keypair = forge.rsa.generateKeyPair({ bits: args.bits, e: 0x10001 });
        this._private_key = keypair.privateKey;
        this._public_key = keypair.publicKey;
        var obj = {};
        obj.public_key = forge.pki.publicKeyToPem(keypair.publicKey);
        if (args.passphrase) {
            obj.private_key = forge.pki.encryptRsaPrivateKey(keypair.privateKey, args.passphrase);
        }
        else {
            obj.private_key = forge.pki.privateKeyToPem(keypair.privateKey);
        }
        return obj;
    };
    /**
     * Wrapper for making the public and private keys with an auto generated passphrase
     * @property {number} bits - the bit size defaults to 2048
     */
    AsymCrypt.prototype.make_rsa_keys_with_passphrase = function (args) {
        if (!args.bits) {
            args.bits = 2048;
        }
        var passphrase = this._generate_passphrase();
        var obj = this.make_rsa_keys({ passphrase: passphrase, bits: args.bits });
        obj.passphrase = passphrase;
        return obj;
    };
    /**
     * Set the aes key
     * @property {string} aes_key - the new aes key
     * @return {boolean} the operation was completed
     */
    AsymCrypt.prototype.set_aes_key = function (args) {
        this._aes_key = args.aes_key;
        return true;
    };
    /**
     * Generate the aes key
     * @return {object(aes_key:string)} the aes key as base64
     */
    AsymCrypt.prototype.make_aes_key = function (args) {
        var key = this._generate_key();
        this.set_aes_key({ aes_key: key });
        return { aes_key: key };
    };
    /**
     * Get the encrypted aes key from a public key
     * @property {string} public_key - the public key as a pem string
     * @property {boolean} use_base64 - encode the aes key as base64
     * @return {string} the encrypted aes key
     */
    AsymCrypt.prototype.get_encrypted_aes_key = function (args) {
        var public_asym = new AsymCrypt();
        public_asym.set_public_key({ public_key: args.public_key });
        var encrypted_key = public_asym.rsa_encrypt({ text: this._aes_key });
        if (args.use_base64) {
            encrypted_key.ciphertext = forge.util.encode64(encrypted_key.ciphertext);
        }
        return { encrypted_key: encrypted_key.ciphertext };
    };
    /**
     * Set the aes key from an encrypted string
     * @property {string} aes_key - the encrypted aes key
     * @property {boolean} use_base64 - if the aes key is base 64 encoded
     */
    AsymCrypt.prototype.set_aes_key_from_encrypted = function (args) {
        if (args.use_base64) {
            args.aes_key = forge.util.decode64(args.aes_key);
        }
        var text = this.rsa_decrypt({ ciphertext: args.aes_key });
        this.set_aes_key({ aes_key: text.text });
        return true;
    };
    /**
     * Encrypt plain text with the public key
     * @property {string} text - the text to encrypt
     * @property {boolean} use_base64 - encode the encrypted text as base64
     * @return {object(ciphertext:string)} - the encrypted text
     */
    AsymCrypt.prototype.rsa_encrypt = function (args) {
        var encrypted = this._public_key.encrypt(args.text, 'RSA-OAEP', {
            mgf1: {
                md: forge.md.sha1.create()
            }
        });
        if (args.use_base64) {
            encrypted = forge.util.encode64(encrypted);
        }
        return { ciphertext: encrypted };
    };
    /**
     * Decrypt encrypted text witht the private key
     * @property {string} ciphertext - the text to decrypt
     * @property {boolean} use_base64 - if the text is encoded as base64
     * @return {object(text:string)} - the decrypted text
     */
    AsymCrypt.prototype.rsa_decrypt = function (args) {
        if (args.use_base64) {
            args.ciphertext = forge.util.decode64(args.ciphertext);
        }
        var text = this._private_key.decrypt(args.ciphertext, 'RSA-OAEP', {
            mgf1: {
                md: forge.md.sha1.create()
            }
        });
        return { text: text };
    };
    /**
     * Encrypt text using aes encryption
     * @property {string} text - the text to encrypt
     * @return {object(ciphertext:string} the encrypted text
     */
    AsymCrypt.prototype.encrypt = function (args) {
        var token = new fernet.Token({
            secret: new fernet.Secret(this._aes_key),
        });
        return { ciphertext: token.encode(args.text) };
    };
    /**
     * Decrypt text using aes encryption
     * @property {string} ciphertext - the text to decrypt
     * @return {object(text:string)} the decrypted text
     */
    AsymCrypt.prototype.decrypt = function (args) {
        var token = new fernet.Token({
            secret: new fernet.Secret(this._aes_key),
            token: args.ciphertext,
            ttl: 0
        });
        return { text: token.decode() };
    };
    return AsymCrypt;
})();
/**
 * The worker command queue
 * @type {array}
 */
var queue = [];
/**
 * The main asymcrypt class for the worker
 */
var crypt = new AsymCrypt();
onmessage = function (event) {
    queue.push(JSON.parse(event.data));
};
var waitLoop = function () {
    setTimeout(function () {
        if (queue.length > 0 && !lock) {
            var action = queue.shift();
            lock = true;
            var id = action.id;
            var rst = crypt[action.cmd](action.args);
            post(action.cmd, rst, id);
        }
        waitLoop();
    }, 100);
};
waitLoop();
