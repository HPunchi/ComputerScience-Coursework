const crypto = require("crypto"); //module used to provide cryptography functions
//require("dotenv").config({ path: '../.env' }); //access to ENV file
require('dotenv').config();


const encrObj = { //ecnryption object storing HomeShield salt and IV in object
  salt: process.env.SECRET_SALT,
  iv: process.env.SECRET_IV
};

const securityHash = process.env.SECURITY_HASH; 
//storing a securityHash sequence in variable from env file

function hash(text){ //hashes text using SHA256 after combining it with the security hash as defined earlier
    return crypto.createHash("sha256").update(text + securityHash).digest('hex');
}
function deriveKey(passphrase, salt, keyLength=32) { //function to convert string key into key of fixed bytes format
  return crypto.pbkdf2Sync(passphrase, salt, 10000, keyLength, 'sha256');
}
function encrypt(text, key) { //global encryption func taking in as paramters text and key as strings
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',  //encryption algorithm
    deriveKey(key, encrObj.salt), //get key in fixed bytes format
    Buffer.from(encrObj.iv)); //get bytes from initialisation vector
  let encrypted = cipher.update(text); //appply cipher to plaintext
  encrypted = Buffer.concat([encrypted, cipher.final()]); //concatenate to remaining bits
  return encrypted.toString('hex'); //return encrypted version as a string with relevant encoding
}
function decrypt(encryptedText, key) { //global decryption func taking in as paramters text and key as strings
    try{ //encapsulate code as invalid decryptions would flag errors and crash the program
        const decipher = crypto.createDecipheriv( //same process for encryption
            'aes-256-cbc',
            deriveKey(key, encrObj.salt), 
            Buffer.from(encrObj.iv));
        let decrypted = decipher.update(Buffer.from(encryptedText, 'hex')); 
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString(); //return original text as a string
    }catch(err){
        console.log(err);
        return false; //any caught errors (i.e. due to invalid decryption) return boolean value false
    }
}

module.exports = { hash, encrypt, decrypt };
