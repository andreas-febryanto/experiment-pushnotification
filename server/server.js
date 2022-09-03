const express = require("express");
const cors = require("cors");
const webpush = require("web-push");
const bodyparser = require("body-parser");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./data/db.json");
const db = low(adapter);
//generate VAPIDKeys
// webpush.generateVAPIDKeys();
require("dotenv").config();

const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT,
};
db.defaults({
  subscriptions: [],
}).write();

function sendNotifications(subscriptions) {
  // TODO
}

const app = express();
app.use(bodyparser.json());
app.use(express.static("public"));
app.use(cors());

app.post("/add-subscription", (request, response) => {
  try {
    db.get("subscriptions").push(request.body).write();
    response.sendStatus(200);
  } catch (error) {
    console.log("\x1b[31m%s\x1b[0m", `error`);
    console.log(error);
  }
});

app.post("/remove-subscription", (request, response) => {
  db.get("subscriptions").remove({ endpoint: request.body.endpoint }).write();
  response.sendStatus(200);
});

app.post("/notify-me", (request, response) => {
  console.log("/notify-me");
  console.log(request.body);
  response.sendStatus(200);
});

app.post("/notify-all", (request, response) => {
  console.log("/notify-all");
  response.sendStatus(200);
});

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${listener.address().port}`);
});
