const crypto = require('crypto');
const algorithm = 'des';
let key = 'netc019b';
let iv = Buffer.from([
    18, 52, 86, 120,
    144, 171, 205, 239
]);

let encrypt = function (text) {
    try {
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (err) {
        console.error(err);
        return '';
    }
}

let decrypt = function (text) {
    try {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(text, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error(err);
        return '';
    }
}

module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;