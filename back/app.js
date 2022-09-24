const express = require("express");

let port = parseInt(process.argv[2]) || 3000;

let blockchain = require("./src/blockchain/blockchain");


const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());

blockchain(app, "http://127.0.0.1" + ":" + port.toString());



app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});