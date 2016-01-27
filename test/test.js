
describe('Alice And Bob Example',function(){
    it('Should Share Mesages',function(done){
        var bob = new master();
        var alice = new master();
        var bobPromise = bob.exec('make_rsa_keys');
        var alicePromise = alice.exec('make_rsa_keys');
        Promise.all([bobPromise,alicePromise]).then(function(values){
            bob.exec('make_aes_key').then(function(rst){
                alice.exec('public_key').then(function(rst){
                    bob.exec('get_encrypted_aes_key',{public_key:rst.public_key}).then(function(rst){
                        alice.exec('set_aes_key_from_encrypted',{aes_key:rst.encrypted_key}).then(function(rst){
                            var msg = 'hello';
                            bob.exec('encrypt',{text:msg}).then(function(rst){
                                expect(rst.ciphertext).not.toEqual(msg);
                                alice.exec('decrypt',{ciphertext:rst.ciphertext}).then(function(rst){
                                    expect(rst.text).toEqual(msg);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    },20000);
});
