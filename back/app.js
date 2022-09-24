const express = require("express");
const csv = require("fast-csv");
const fs = require("fs");
const { format } = require('@fast-csv/format');
const AES = require("crypto-js/aes");
var CryptoJS = require("crypto-js");

let port = parseInt(process.argv[2]) || 3000;

// const csvStream = csv.format({headers: true});

// csvStream.pipe(process.stdout).on("end", () => process.exit());

// csvStream.write({ header1: 'row1-col1', header2: 'row1-col2' });
// csvStream.write({ header1: 'row2-col1', header2: 'row2-col2' });
// csvStream.write({ header1: 'row3-col1', header2: 'row3-col2' });
// csvStream.write({ header1: 'row4-col1', header2: 'row4-col2' });
// csvStream.end();

const dataMap = new Map();


const fileName = `./data/${port}/bc.csv`;

//Appending to csv works here
// const csvFile = fs.createWriteStream(fileName, { flags: 'a'});
// const stream = format({ headers:false , includeEndRowDelimiter: true });
// stream.pipe(csvFile);
// stream.write({"hello": "1", "bye": 2});
// // stream.write({"hello": "1", "bye": 2});
// stream.end();
//Append ending

let initializeMap = () => {
    fs.createReadStream(fileName)
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => {
        client = row.client;
        data = row.data;
        if (dataMap.has(client)) { //client with history
            let arr = dataMap.get(client);
            arr.push(data);
            dataMap.set(client, arr);
        } else {
            dataMap.set(client, [data]); //client without history
        }
    })
    .on('end', rowCount => {console.log(`Initialized with ${rowCount} rows`)});  
} 

let addClientData = (client, data) => {
    if (dataMap.has(client)) {
        let arr = dataMap.get(client);
        arr.push(data);
        dataMap.set(client, arr);
    } else {
        dataMap.set(client, [data]);
    }
    const stream = format({ headers:false , includeEndRowDelimiter: true });
    const csvFile = fs.createWriteStream(fileName, { flags: 'a'});
    stream.pipe(csvFile);
    stream.write({"client": client, "data": data, "height": 1});
    stream.end();
}

initializeMap();

let blockchain = require("./src/blockchain/blockchain");

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());

blockchain(app, "http://127.0.0.1" + ":" + port.toString(), port);

//TODO authentication
app.post("/clientHistory", (req, res) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let social = (req.body.ssn).toString();
    let bday = (req.body.bday).toString();

    let cipherKey = social + bday;
    
    console.log(cipherKey);

    let toHash = firstName+"_"+lastName;

    let clientHash = AES.encrypt(toHash, cipherKey).toString();
    let clientHash2 = AES.encrypt(toHash, cipherKey).toString();
    console.log("testing similarity")
    console.log(clientHash);
    console.log(clientHash2);
    // let bytes = AES.decrypt(clientHash, cipherKey);

    // console.log(bytes.toString(CryptoJS.enc.Utf8));
    
    console.log(clientHash);

    if (dataMap.has(clientHash)) {
        let dat = dataMap.get(clientHash);
        let bytes = AES.decrypt(dat, clientHash);
        res.send(bytes.toString(CryptoJS.enc.Utf8));
    } else {
        res.send([]);
    }

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

    let clientHash = AES.encrypt(firstName+"_"+lastName, cipherKey).toString();
    let dataHash = AES.encrypt(JSON.stringify(data), cipherKey).toString();

    addClientData(clientHash, dataHash);    
    res.sendStatus(200);
})


app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});