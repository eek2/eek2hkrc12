require('dotenv').config();
const axios = require("axios");
let peers = [];
let key = process.env.KEY;
let myip;
const options = {headers: {"Content-Type": "application/json"}}
const default_peer = 'http://localhost:3000'
const addpeerPost = (req, res) => {
    console.log(req.socket.remoteAddress)
    console.log(req.socket.address)
    console.log(req.socket.localPort);
    console.log(req.socket.remotePort);
    console.log(req.body.myip);
    // console.log(req);
    res.sendStatus(200);
}

const connectPeerPost = async (req, res) => {
    let payload = { myip: myip};

    let resp = await axios.post(default_peer + "/addpeer", payload, options);
    // console.log(res);
    res.sendStatus(200);
}

module.exports = (app, ip) => {
    //app.get("/adsasd", func);
    app.post("/addpeer", addpeerPost);
    app.post("/connectpeer", connectPeerPost);
    myip = ip;
}