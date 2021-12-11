const { Blockchain, Transaction } = require("./blockchain");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const myKey = ec.keyFromPrivate('5ecc90b408ca85a1b18cd9b369a24439119424ad73dbc8f9a9664064748f5671');
const myWalletAddress = myKey.getPublic('hex');

//create blockchain!
let TravisCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'someone else public key goes here', 10);
tx1.signTransaction(myKey);
TravisCoin.addTransaction(tx1);



console.log("\n Starting the miner...");
TravisCoin.minePendingTransactions(myWalletAddress)

console.log("\n Andrews's balance is ", TravisCoin.getBalanceOfAddress(myWalletAddress));

// VALIDITY TESTS
// trying to change first transaction amount in the second block (zero is genesis):
TravisCoin.chain[1].transactions[0].amount = 1;
console.log("Is blockchain valid? " + TravisCoin.isChainValid());



// VIEW BLOCKCHAIN
// // console.log(JSON.stringify(TravisCoin, null, 4));
