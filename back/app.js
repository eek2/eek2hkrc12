const express = require("express");
const csv = require("fast-csv");
const fs = require("fs");
const { format } = require('@fast-csv/format');
const AES = require("crypto-js/aes");
const hmac = require("crypto-js/hmac-sha256");
const CryptoJS = require("crypto-js");
const bcrypt = require('bcrypt');
// import { v4 as uuidv4 } from 'uuid';
// uuidv4();
const crypto = require("crypto");
const alarm = require('alarm');

// console.log(crypto.randomBytes(32).toString("hex"));

// console.log(Date.now()); //GetUNIX

let port = parseInt(process.argv[2]) || 3000;
const selfip = "http://127.0.0.1" + ":" + port.toString()
// const csvStream = csv.format({headers: true});

// csvStream.pipe(process.stdout).on("end", () => process.exit());

// csvStream.write({ header1: 'row1-col1', header2: 'row1-col2' });
// csvStream.write({ header1: 'row2-col1', header2: 'row2-col2' });
// csvStream.write({ header1: 'row3-col1', header2: 'row3-col2' });
// csvStream.write({ header1: 'row4-col1', header2: 'row4-col2' });
// csvStream.end();

const peerCount = 3;

const dataMap = new Map();

let bc = [];

const fileName = `./data/${port}/bc.csv`;

//Appending to csv works here
// const csvFile = fs.createWriteStream(fileName, { flags: 'a'});
// const stream = format({ headers:false , includeEndRowDelimiter: true });
// stream.pipe(csvFile);
// stream.write({"hello": "1", "bye": 2});
// // stream.write({"hello": "1", "bye": 2});
// stream.end();
//Append ending

let currentheight;

// let initializeMap = () => {
//     fs.createReadStream(fileName)
//     .pipe(csv.parse({ headers: true }))
//     .on('error', error => console.error(error))
//     .on('data', row => {
//         client = row.client;
//         data = row.data;
//         if (dataMap.has(client)) { //client with history
//             let arr = dataMap.get(client);
//             arr.push(data);
//             dataMap.set(client, arr);
//         } else {
//             dataMap.set(client, [data]); //client without history
//         }
//     })
//     .on('end', rowCount => {console.log(`Initialized with ${rowCount} rows`)});  
// }

//Readining bc.csv, filling the data hashmap
let initializeMap = () => {
    fs.createReadStream(fileName)
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => {
        let currentheight = row.height;
        let transactions = eval(row.transactions)
        let targetID = row.tid;
        let timestamp = row.timestamp
        let winhash = row.winhash
        let winsalt = row.winsalt
        let source = row.source
        // console.log(row);
        for (let transaction of transactions) {
            let client = transaction.client;
            let data = transaction.data;
            let source = transaction.source;
            // let uuid = transaction.uuid;
            let trans_timestamp = transaction.timestamp;
            let toAdd = {"data": data, "timestamp": trans_timestamp, "source": source};
            if (dataMap.has(client)) { //client with history
                let arr = dataMap.get(client);
                arr.push(toAdd);
                dataMap.set(client, arr);
            } else {
                dataMap.set(client, [toAdd]); //client without history
            }
        }

        bc.push(row);
    })
    .on('end', rowCount => {console.log(`Initialized with ${rowCount} rows`);});  
}
let unaddedTransactions = []; //Transactions to add to the next block.

let rollHash = () => {
    let lastBlock = bc[bc.length - 1];
    let oldWinHash = lastBlock.winhash;
    let newHeight = parseInt(lastBlock.height) + 1;
    let timestamp = Date.now();
    let salt = crypto.randomBytes(32).toString("hex");
    let toHash = selfip + JSON.stringify(unaddedTransactions) + timestamp + newHeight + oldWinHash;
    let attemptedWinnerHash = hmac(toHash, salt).toString();
    // console.log(salt)
    // console.log("inside roll")
    // console.log(attemptedWinnerHash);
    // console.log(attemptedWinnerHash.length);

    let newAttemptedBlock = {
        "height": newHeight,
        "transactions": JSON.stringify(unaddedTransactions),
        "tid": hmac(attemptedWinnerHash, oldWinHash).toString(), //new target hash is new hash hashed by old hash
        "timestamp": timestamp,
        "winhash": attemptedWinnerHash,
        "winsalt": salt,
        "source": selfip
    }
    unaddedTransactions = []; //clear here
    checkBlock(newAttemptedBlock);
    return (newAttemptedBlock);
}

let nextConsensusTime = () => {
    let now = new Date();
    now.setUTCSeconds(0);
    now.setUTCMilliseconds(0);
    // now = new Date(now + 3600 * 1000 * (2 - now.getUTCMinutes()%2))
    // console.log(now.toUTCString());
    // console.log(now)
    now = new Date(now.valueOf() + (60 * 1000) * ((2 - now.getUTCMinutes()%2))); //should be 60 * 1000
    // console.log(now.toUTCString());
    return now;
}

let checkBlock = (block) => {
    let lastBlock = bc[bc.length - 1];
    let oldWinHash = lastBlock.winhash;
    let new_transactions = eval(block.transactions)
    let toHash = block.source + JSON.stringify(new_transactions) + block.timestamp + block.height + oldWinHash;
    if (block.winhash == (hmac(toHash, block.winsalt).toString())) {
        let lastTarget = lastBlock.tid;
        let totalDistance = 0;
        for(let i = 0; i < lastTarget.length; i++) {
            totalDistance += Math.abs(lastTarget.charCodeAt(i) - block.winhash.charCodeAt(i));
        }
        console.log(totalDistance);
        return (totalDistance)
    } else {
        return(-1)
    }
}

// nextConsensusTime();

//  New block process
//1.) Each nodes creates their block to win
//2.) Wait till send time and send blocks to each other
//3.) Then each person sends their votes to each other
//4.) Then they write the blocks down



let addTransaction = (transaction) => {
    let timestamp = transaction.timestamp;
    let client = transaction.client;
    let data = transaction.data;
    let source = transaction.source;
    let toAdd = {"data": data, "timestamp": timestamp, "source": source};
    if (dataMap.has(client)) {
        let arr = dataMap.get(client);
        arr.push(toAdd);
        dataMap.set(client, arr);
    } else {
        dataMap.set(client, [toAdd]);
    }
    unaddedTransactions.push(transaction);
    // const stream = format({ headers:false , includeEndRowDelimiter: true });
    // const csvFile = fs.createWriteStream(fileName, { flags: 'a'});
    // stream.pipe(csvFile);
    // stream.write({"client": client, "data": data, "height": 1});
    // stream.end();
}

let currentNomin = new Map();
let currentBestDistance = -1;
let currentNominCount = 0;

let writeBlock = (block) => {
    currentNomin = new Map(); //reset nominee stuff.
    currentBestDistance = -1;
    currentNominCount = 0;
    bc.push(block);
    const stream = format({ headers:false , includeEndRowDelimiter: true });
    const csvFile = fs.createWriteStream(fileName, { flags: 'a'});
    stream.pipe(csvFile);
    stream.write({"height": block.height, "transactions": block.transactions, "tid": block.tid, "timestamp": block.timestamp, "winhash": block.winhash, "winsalt": block.winsalt, "source": block.source});
    stream.end();
}

initializeMap();

let blockchain = require("./src/blockchain/blockchain");

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());

let sendtoPeers; //define before usage
let sendVote;
let sendBlock;

let getBlock = (block, source) => {
    console.log("got block from " + source)
    let similarity = checkBlock(block);
    currentNomin.set(block, {"source": source, "similarity": similarity});
    currentNominCount++;
    if (similarity > 0) {
        if (currentBestDistance == -1) {
            currentBestDistance = similarity;
        } else if (currentBestDistance < similarity) {
            currentBestDistance = similarity;
        }
    }
    if (currentNominCount == peerCount) {
        //vote
        let toVoteFor;
        let similarity = -1;
        currentNomin.forEach((value, key) => {
            if (similarity == -1) {
                toVoteFor = value.source;
                similarity = value.similarity;
            } else if (similarity > value.similarity) {
                toVoteFor = value.source;
                similarity = value.similarity;
            }
        });
        console.log("voted for " + toVoteFor);
        sendVote(toVoteFor);
        getVote(toVoteFor, selfip);
    }
}

let votes = new Map();
let voteCount = 0;
let getVote = (vote, source) => {
    voteCount++;
    console.log("got vote for " + vote + " from " + source)
    if (votes.has(vote)) {
        votes.set(vote, votes.get(vote) + 1)
    } else {
        votes.set(vote, 1);
    }
    if (voteCount == peerCount) {
        
        let maxSource = -1;
        let maxCount = -1;
        votes.forEach((value, key) => { //Find the block with the most votes
            if (maxSource == -1) {
                maxSource = key
                maxCount = value
            } else if (maxCount < value){
                maxSource = key
                maxCount = value;
            }
        });
        let block;
        console.log(`${port} decided on ${maxSource}`)
        currentNomin.forEach((value, key) => { //get best block;
            if (value.source == maxSource) {
                block = key;
            }
        })
        writeBlock(block);
        votes = new Map();
        voteCount = 0;
    }
}


let giveChain = () => {return bc};

[sendtoPeers, sendBlock, sendVote] = blockchain(app, "http://127.0.0.1" + ":" + port.toString(), port, addTransaction, giveChain, getBlock, getVote);

let addClientData = (client, data) => {
    let timestamp = Date.now();
    sendtoPeers(client, data, timestamp, selfip);
    let toAdd = {"data": data, "timestamp": timestamp, "source": selfip};
    if (dataMap.has(client)) {
        let arr = dataMap.get(client);
        arr.push(toAdd);
        dataMap.set(client, arr);
    } else {
        dataMap.set(client, [toAdd]);
    }
    // const stream = format({ headers:false , includeEndRowDelimiter: true });
    // const csvFile = fs.createWriteStream(fileName, { flags: 'a'});
    // stream.pipe(csvFile);
    // stream.write({"client": client, "data": data, "height": 1});
    // stream.end();
    let toAddToTransactions = {"client": client, "data": data, "timestamp": timestamp, "source": selfip};
    unaddedTransactions.push(toAddToTransactions);
}



//TODO authentication
app.post("/clientHistory", (req, res) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let social = (req.body.ssn).toString();
    let bday = (req.body.bday).toString();

    let cipherKey = social + bday;
    
    // console.log(cipherKey);

    let toHash = firstName+"_"+lastName;

    let clientHash = hmac(toHash, cipherKey).toString();

    // let bytes = AES.decrypt(clientHash, cipherKey);

    // console.log(bytes.toString(CryptoJS.enc.Utf8));
    
    console.log(clientHash);
    let toSend = []
    if (dataMap.has(clientHash)) {
        let dat = dataMap.get(clientHash);
        for (let entry of dat) {
            console.log(entry)
            let bytes = AES.decrypt(entry.data, cipherKey);
            let decrypted = eval(bytes.toString(CryptoJS.enc.Utf8));
            toSend.push({"data": decrypted, "source": entry.source, "timestamp": entry.timestamp});
        }

        // console.log(dat);
        // let bytes = AES.decrypt(dat[0], cipherKey);
        // console.log(bytes)
        // let toSend = eval(bytes.toString(CryptoJS.enc.Utf8)); //IF the data is an object, but for simplicity im making the data only a string
        // console.log(toSend);
        // res.send(toSend);
    }
    res.send(toSend);

    // console.log(clientHash);
    // console.log(AES.decrypt(Array.from(dataMap.keys())[0], clientHash).toString());

    // console.log(dataMap.get(clientHash));
    // let dat = AES.decrypt(dataMap.get(clientHash), cipherKey);
    // console.log(dat);
    // res.sendStatus(200);
});

app.post("/addClientHistory", (req, res) => {
    let firstName = (req.body.firstName).toLowerCase();
    let lastName = (req.body.lastName).toLowerCase();
    let social = (req.body.ssn).toString();
    let bday = (req.body.bday).toString();

    let data = req.body.data;

    let cipherKey = social + bday; 

    let clientHash = hmac(firstName+"_"+lastName, cipherKey).toString();
    let dataHash = AES.encrypt(JSON.stringify(data), cipherKey).toString();

    addClientData(clientHash, dataHash);    
    res.sendStatus(200);
})


app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

let consensusStart = () => {
    let attemptedBlock = rollHash();
    sendBlock(attemptedBlock);
    getBlock(attemptedBlock, selfip);
    // writeBlock(attemptedBlock);
}


let setAlarm = () => { //Recurring consensus alarm
    alarm(nextConsensusTime(), function() {
        console.log("alarm")
        console.log((new Date()).toUTCString());
        consensusStart();
        setTimeout(() => { //reset the alarm
            setAlarm();
          }, "5000")
    });

}

setAlarm();