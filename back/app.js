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


// console.log(crypto.randomBytes(32).toString("hex"));

console.log(Date.now()); //GetUNIX

let port = parseInt(process.argv[2]) || 3000;
const selfip = "http://127.0.0.1" + ":" + port.toString()
// const csvStream = csv.format({headers: true});

// csvStream.pipe(process.stdout).on("end", () => process.exit());

// csvStream.write({ header1: 'row1-col1', header2: 'row1-col2' });
// csvStream.write({ header1: 'row2-col1', header2: 'row2-col2' });
// csvStream.write({ header1: 'row3-col1', header2: 'row3-col2' });
// csvStream.write({ header1: 'row4-col1', header2: 'row4-col2' });
// csvStream.end();

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
    .on('end', rowCount => {console.log(`Initialized with ${rowCount} rows`)});  
}
let unaddedTransactions = []; //Transactions to add to the next block.

let rollHash = () => {
    let lastBlock = bc[bc.length - 1];
    let newHeight = lastBlock.height + 1;
    let timestamp = Date.now();
}

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



initializeMap();

let blockchain = require("./src/blockchain/blockchain");

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());


let giveChain = () => {return bc};

let sendtoPeers = blockchain(app, "http://127.0.0.1" + ":" + port.toString(), port, addTransaction, giveChain);

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
            let bytes = AES.decrypt(entry, cipherKey);
            toSend.push(eval(bytes.toString(CryptoJS.enc.Utf8)));
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