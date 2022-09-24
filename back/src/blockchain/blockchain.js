require('dotenv').config();
const axios = require("axios");
let peers = [];
let key = process.env.KEY;
let myip;
let myport;

const default_peer = 'http://localhost:3000'

const addpeerPost = (req, res) => {
    const new_peer = req.body.myip;
    res.sendStatus(200);
    if (!peers.includes(new_peer)) {
        peers.push(new_peer);
    }
}

const getChain = (req, res) => {
    let auth = req.params.KEY;
    if (auth == key) {
        //send the blockchain ig lmao
    } else {
        res.sendStatus(401);
    }

}

const connectPeerPost = async (req, res) => {
    let payload = { myip: myip};

    let resp = await axios.post(default_peer + "/addpeer", payload, options);
    // console.log(res);
    res.sendStatus(200);
}

module.exports = (app, ip, port) => {
    //app.get("/adsasd", func);
    app.post("/addpeer", addpeerPost);
    app.post("/connectpeer", connectPeerPost);
    myip = ip;
    myport = port;
}