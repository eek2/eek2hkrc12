require('dotenv').config();

const axios = require("axios");
let peers = [];
let key = process.env.KEY;
let myip;
let myport;
let giveTrans;
let gChain;
let giveBlock;
let giveVote;
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

const getBlockNomination = (req, res) => {
    const block = req.body.block;
    const source = req.body.source;
    console.log("got nomination")
    giveBlock(block, source);
    res.sendStatus(200);
}

const getBCVote = (req, res) => {
    let vote = req.body.vote;
    let source = req.body.source;
    // console.log("gotVote");
    giveVote(vote, source);
    res.sendStatus(200);
}

const sendToPeers = (clientHash, dataHash, timestamp, source) => {
    if (peers.length > 0) {
        for (let peer of peers) {
            let payload = {"client": clientHash, "data": dataHash, "timestamp": timestamp, "source": source};
            axios.post(peer + "/addTransaction", payload).then((response)=> {console.log("Transaction sent to " + peer)}, (error) => {console.log("Couldnt send to " + peer)});
        }
    }
}
const sendBlock = (block) => {
    if (peers.length > 0) {
        for (let peer of peers) {
            let payload = {"block": block, "source": myip};
            axios.post(peer + "/blocknomination", payload).then((response)=> {console.log("Block sent to " + peer)}, (error) => {console.log("Couldnt send to " + peer)});
        }
    }
}
const sendVote = (vote) => {
    if (peers.length > 0) {
        for (let peer of peers) {
            let payload = {"vote": vote, "source": myip};
            axios.post(peer + "/getBCVote", payload).then((response)=> {console.log("Vote sent to " + peer)}, (error) => {console.log("Couldnt send to " + peer)});
        }
    }
}

module.exports = (app, ip, port, giveTransactionData, getBc, gvBlock, gvVote) => {
    //app.get("/adsasd", func);
    app.post("/addpeer", addPeerPost);
    app.post("/connectpeer", connectPeerPost);
    app.post("/addTransaction", addTransactionPost);
    app.post("/getChain", getChainPost);
    app.post("/blocknomination", getBlockNomination);
    app.post("/getBCVote", getBCVote);
    myip = ip;
    myport = port;

    if (port == 3000) {
        peers = ["http://127.0.0.1:3001", "http://127.0.0.1:3002"]
    } else if (port == 3001) {
        peers = ["http://127.0.0.1:3000", "http://127.0.0.1:3002"]
    } else if (port == 3002) {
        peers = ["http://127.0.0.1:3001", "http://127.0.0.1:3000"]
    }

    giveTrans = giveTransactionData;
    gChain = getBc;
    giveBlock = gvBlock;
    giveVote = gvVote;
    return [sendToPeers, sendBlock, sendVote];
}