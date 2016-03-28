'use strict';

import * as openpgp from 'openpgp';
import Password from './Password.js';
import fileSystem from './file-system.js';

export function decrypt(privateKey, file, password) {
    return Promise.all([
        privateKey.open(),
        fileSystem.readFileAsBlob(file)
    ]).then((results) => {
        const privateKey = results[0];
        const message = openpgp.message.read(results[1]);

        if (!privateKey.decrypt(password)) {
            throw new Error('Incorrect password');
        }

        const options = {
            message: message,
            privateKey: privateKey,
            armor: false
        };

        return openpgp.decrypt(options);
    }).then((result) => {
        return new Password(result.data);
    });
}

export function encrypt(publicKey, file, content) {
    return publicKey.open().then((publicKeys) => {
        const password = new Password(content);

        const options = {
            data: password.toString(),
            publicKeys: publicKeys,
            armor: false
        };

        return openpgp.encrypt(options);
    }).then((result) => {
        const encrypted = result.message.packets.write();
        return fileSystem.writeFileWithBlob(file, encrypted);
    });
}