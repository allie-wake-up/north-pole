'use strict';

import * as openpgp from 'openpgp';
import Password from './Password.js';
import fileSystem from './file-system.js';
import storage from './storage.js';

export default class PrivateKey {
    constructor(entry) {
        this.entry = entry;
    }

    static fetch() {
        return storage.fetch('privateKey').then((keyId) => {
            if (!keyId) {
                throw new Error('Please select a private key in northern pass');
            }
            return fileSystem.restoreEntry(keyId);
        }).then((entry) => {
            if (!entry) {
                throw new Error('Could not find private key');
            }
            return new PrivateKey(entry);
        });
    }

    static save(entry) {
        const keyId = fileSystem.retainEntry(entry);
        return storage.save({'privateKey': keyId}).then(() => {
            return new PrivateKey(entry);
        });
    }

    decrypt(file, password) {
        return Promise.all([
            this.open(),
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
        }).then(result => new Password(result));
    }

    getDisplayPath() {
        return fileSystem.getDisplayPath(this.entry);
    }

    open() {
        return fileSystem.readFileAsText(this.entry).then((contents) => {
            const privateKey = openpgp.key.readArmored(contents).keys[0];
            if (privateKey.err) {
                throw new Error('Could not open private key');
            }
            return privateKey;
        });
    }

    testPassword(password) {
        return this.open().then(privateKey => privateKey.decrypt(password));
    }
}