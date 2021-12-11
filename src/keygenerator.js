// to generate private and public key and methods to sign and method to verify signature
const EC = require('elliptic').ec;
// Algorithm that is the basis of bitcoin wallets
const ec = new EC('secp256k1');
// generate key pair
const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privateKey = key.getPrivate('hex');

console.log();
console.log("private key: ", privateKey);
console.log();
console.log("public key: ", publicKey);