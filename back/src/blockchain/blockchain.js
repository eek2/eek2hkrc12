require('dotenv').config();

const axios = require("axios");
let peers = [];
let key = process.env.KEY;
let myip;
let myport;
let giveTrans;
let gChain;
const default_peer = 'http://localhost:3000'

const addPeerPost = (req, res) => {
    const new_peer = req.body.myip;
    res.sendStatus(200);
    if (!peers.includes(new_peer)) {
        peers.push(new_peer);
    }
}

const getChainPost = (req, res) => {
    let auth = req.body.KEY; //Maybe make this into a jwt
    if (auth == key) {
        //send the blockchain ig lmao
        res.send(gChain()); //give the bc object as a list
    } else {
        res.sendStatus(401);
    }
}

const addTransactionPost = (req, res) => {
    const clientHash = req.body.client;
    const dataHash = req.body.data;
    const source = req.body.source;
    const timestamp = req.body.timestamp;
    giveTrans({"client": clientHash, "data": dataHash, "timestamp": timestamp, "source": source});
    res.sendStatus(200);
}

//Testing purposes only. Force the client to sent a add peer request.
const connectPeerPost = async (req, res) => {
    let payload = { myip: myip};

    let resp = await axios.post(default_peer + "/addpeer", payload, options);
    // console.log(res);
    res.sendStatus(200);
}

const sendToPeers = (clientHash, dataHash) => {
    if (peers.length > 0) {
        for (let peer of peers) {
            let payload = {"client": clientHash, "data": dataHash};
            axios.post(peer + "/addTransaction", payload).then((response)=> {console.log("Transaction sent to " + peer)}, (error) => {console.log("Couldnt send to " + peer)});
        }
    }
}

module.exports = (app, ip, port, giveTransactionData, getBc) => {
    //app.get("/adsasd", func);
    app.post("/addpeer", addPeerPost);
    app.post("/connectpeer", connectPeerPost);
    app.post("/addTransaction", addTransactionPost);
    app.post("/getChain", getChainPost);
    myip = ip;
    myport = port;
    giveTrans = giveTransactionData;
    gChain = getBc;
    return sendToPeers;
}