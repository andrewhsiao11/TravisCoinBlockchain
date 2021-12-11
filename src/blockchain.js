const SHA256 = require("crypto-js/sha256");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

// defining what a transaction looks like to make a cryptocurrency
class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
  }
  // signingKey will be object (const key = ec.genKeyPair()) that contains both keys
  signTransaction(signingKey) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallets!");
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
  }

  isValid() {
    //reward for mining has a fromAddress of null
    if (this.fromAddress === null) return true;
    // if no sig or empty, throw error
    if (!this.signature || this.signature.length === 0) {
      throw new Error("No signature in this transaction");
    }
    // must verify if transaction was signed with correct key
    const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

// defining what a block on the blockchain will look like
class Block {
  constructor(timestamp, transactions, previousHash = "") {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  // calculate hash of current block from other params in block (using SHA256)
  calculateHash() {
    return SHA256(
      this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
    ).toString();
  }

  // creating proof of work algorithm (bitcoin style where hash must start with enough zeros)
  mineBlock(difficulty) {
    // take the first n number of characters of hash, where n is difficulty
    // run as long as substring is not equal to all zeros
    // ensuring difficulty set to a specific number of zeros
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    // since hash would not change if contents of block aren't changed...
    // so infinite while loop because <<this.hash = this.calculateHash()>> will not add zeros
    // can't edit any of the other values in the block so...
    // need to add a nonce (number only used once) in order to get hash to change
    // this links block to the difficulty level through hash
    console.log("BLOCk MINED: " + this.hash);
  }

  // verify all transactions in current block
  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

class Blockchain {
  // responsible for initializing blockchain via array of blocks with genesis as start
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  // manually make genesis block
  createGenesisBlock() {
    return new Block(Date.parse("2021-01-01"), [], "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // normally way to many pending transactions and block size cannot exceed 1 megabit
  // miners would pick what transactions they want to include
  // Peer-To-Peer network protects this method from being tampered with
  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTx);

    let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    console.log("Block successfully mined!");
    this.chain.push(block);

    // resetting pending transactions array
    this.pendingTransactions = [];
  }

  // adding transactions to pending transaction array
  addTransaction(transaction) {
    // check if both from and to addresses are filled in
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include FROM and TO address");
    }
    // verify that transaction to be added is valid
    if (!transaction.isValid()) {
      throw new Error("Cannot add invalid transaction to the chain");
    }

    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    // loop over all transactions in all blocks of blockchain
    // adding and subtracting balances from receiver and sender
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  // OLD MINING METHOD
  //   addBlock(newBlock) {
  //     // links new block with prev block's hash
  //     newBlock.previousHash = this.getLatestBlock().hash;
  //     // calculates new blocks hash based on new properties and difficulty via nonce
  //     newBlock.mineBlock(this.difficulty);
  //     // push new block onto chain (in reality need many checks before just adding)
  //     this.chain.push(newBlock);
  //   }

  // verifying integrity of blockchain (that it has not been edited)
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      // verify if all transactions in current block are valid
      if (!currentBlock.hasValidTransactions()) {
        return false;
      }
      // if recalculate hash and it doesn't equal the blocks hash, then something has been changed
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      // checking if previous block's hash is linked (if it matches current blocks prevHash value)
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
