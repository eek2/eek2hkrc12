require('dotenv').config();

const axios = require("axios");
let peers = [];
let key = process.env.KEY;
let myip;
let myport;
let giveTrans;
const default_peer = 'http://localhost:3000'

const addPeerPost = (req, res) => {
    const new_peer = req.body.myip;
    res.sendStatus(200);
    if (!peers.includes(new_peer)) {
        peers.push(new_peer);
    }
}

const getChain = (req, res) => {
    let auth = req.params.KEY; //Maybe make this into a jwt
    if (auth == key) {
        //send the blockchain ig lmao
    } else {
        res.sendStatus(401);
    }
}

const addTransactionPost = (req, res) => {
    const clientHash = req.body.client;
    const dataHash = req.body.data;
    giveTrans(clientHash, dataHash);
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

module.exports = (app, ip, port, giveTransactionData) => {
    //app.get("/adsasd", func);
    app.post("/addpeer", addPeerPost);
    app.post("/connectpeer", connectPeerPost);
    app.post("/addTransaction", addTransactionPost);
    myip = ip;
    myport = port;
    giveTrans = giveTransactionData;
    return sendToPeers;
}