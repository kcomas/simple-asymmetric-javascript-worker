
var aes_key = 'uaBbv71UYwAndWfYRGO6lqgkJTylUdqLzCGJ7xLyvq4=';
var public_key = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArWrCwDnza3+IRvpCHvKa\nQatyDFFlDrAQvYuZvISkoT+52KOHkCuWbCu/a+mBR1zHS2o75Vvnc0i8T1LWwnQ3\n2xzi4Hhec2i/NLxq72eqmmPY8joSpg6Qpp9CKeGTVt9wLl8ZVnRbI9zAyjY483bk\nCqd/oQvGDC5RVVq7J1gjvyVA6skIH0I5lHYOgsr4cDYUhIt8agN3IuglKZMCySYH\n29C5eWa9trUm6lMsnluu4fWdy14xIIWsG9O7XHtDNmbBTIOExnzCkL7uXaPSthW4\ncoBBV4d5XZ62HTsF6seISuKAQ8VRkY7dwv8K6a4XqJQ5g3/3nNjdjDFo7koCsR7y\nuQIDAQAB\n-----END PUBLIC KEY-----';
var private_key = '-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEArWrCwDnza3+IRvpCHvKaQatyDFFlDrAQvYuZvISkoT+52KOH\nkCuWbCu/a+mBR1zHS2o75Vvnc0i8T1LWwnQ32xzi4Hhec2i/NLxq72eqmmPY8joS\npg6Qpp9CKeGTVt9wLl8ZVnRbI9zAyjY483bkCqd/oQvGDC5RVVq7J1gjvyVA6skI\nH0I5lHYOgsr4cDYUhIt8agN3IuglKZMCySYH29C5eWa9trUm6lMsnluu4fWdy14x\nIIWsG9O7XHtDNmbBTIOExnzCkL7uXaPSthW4coBBV4d5XZ62HTsF6seISuKAQ8VR\nkY7dwv8K6a4XqJQ5g3/3nNjdjDFo7koCsR7yuQIDAQABAoIBAGAZz77y3mBuFjkv\nKkE4NB+8QMFuwc/35e8EU7fS0eDCDd1uEgvk+8EKJVRJ3GiNk6vJPVQHMCYE4sYa\npASyntmAEoJOchkGrR8uYxw0mKhiOLFTWU5IuAR+MQ5AgYQc4m/wJ3xvkqo3BWeJ\n0Nmqwwjcda/rdF7/s/bXBuvwvi6ILv665ZtVwMKtUuY851s0riwUN4cIiifyw/GQ\nLNCrkH2+V3SOMZ8OTOXfMFbDD1cAe4QSPgeFNL/3bKu1e0/Z5b6GLIA9zkiR+0i5\nxq9LDKba/gCyej+YZz9A57MpDi1zmsNV/BPhx9Ns5jY8G9dE1n6/w0Fyf0v+i/93\nhWb1XJkCgYEA0SBF3KgErqsXtz7U05ih0lbKUXnOaJMWewhj0w+zRi9nhJ5X3G2q\nwt+VTyLtoRRW1vklZ9L+zApsfbAROdtA+TA7NFKiu7/de1hzGTWGkqcMEdx3CpLP\nQz7nNchfSAgLagxW6Kb7ob8ytMaegK1id4bOaJ4eV5xemsK3ncf/0OcCgYEA1El9\ntivdU0A5S42qZl4OiD0pHN/E1LOQcwwxKE2Vipzek03NPWtFNOmDRg8mVpbS4MkE\niiH8BnKep4oHY0ac4cBPSQ/7QE2992ge1ru3B8gLcpoeNrJuS6pKr2KPfVQnV+tT\noNtdXoR6EJz9VS12QpbSZF6ClAuOAjgCaIfFi18CgYAoaDr3esOE2Gw5rPtEc055\nLOnkuktmq10BospfAr6aBhjTaCED53DCPJ9F7jLKF/r7iKJwoDU5SZ5S3s1FR5cT\nTv1xi7ID4vuxlJKQwWXiOkK7xMR/l4RSsvnLy46VhXBnKkE0rOccBqyOf34q0NWg\n0LxbPIoSVZV2A7+kzfsg6wKBgA0RIP3PoWX4dA5kf/KhI3/bU+aFF5aIHwIV5Ai5\nDdVkZobmqRV4vt/M59muIQv/aKeReAgQo3S6JW3mnyHLPOjgb4DtzOdeYa0S6aMK\nFvARrjK1rdpsDUH3D3XQOUjbnzhYMeOa3RpuSR0wrJ9LlxXuNrEa6Cq4s1sLm4pX\noR89AoGAOYgo70h6Csg45494yzTsys+gLTytw+wEbefYD4uMLidCgO3hjbuO7G1g\nsOtVPsRVD+8b7qg+45hDMLrcepJeCs751Z6gLCFkJJq2owoSkxxwtDUXgQkZ9NBr\n6dNOEvjztvCkv0n1knFdG1A3VPYHpTI5QIKpA7UxPbdH2p3YkZc=\n-----END RSA PRIVATE KEY-----'; 

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

describe('Testing Encryption And Decryption',function(){
    it('Should Encrypt And Decrypt',function(done){
        var asym = new master(aes_key,public_key,private_key);
        var msg = "hello";
        asym.exec('encrypt',{text:msg}).then(function(rst){
            expect(rst.ciphertext).not.toEqual(msg);
            asym.exec('decrypt',{ciphertext:rst.ciphertext}).then(function(rst){
                expect(rst.text).toEqual(msg);
                done();
            });
        });
    },20000);
});

describe('Tesing Passphrase',function(){
    it('Should Generate and Decrypt private keys',function(done){
        var asym = new master();
        asym.exec('make_rsa_keys_with_passphrase').then(function(rst){
            asym.exec('private_key').then(function(rst2){
                var pri = rst2.private_key;
                asym = new master();
                asym.exec('set_private_key',{passphrase:rst.passphrase, private_key:rst.private_key}).then(function(rst){
                    asym.exec('private_key').then(function(rst2){
                        expect(rst2.private_key).toEqual(pri);
                        done();
                    });
                });
            });
        });
    },20000);
});
