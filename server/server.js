const express = require("express");
const webpush = require("web-push");
const bodyparser = require("body-parser");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./data/db.json");
const db = low(adapter);
const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT,
};
require("dotenv").config();

db.defaults({
  subscriptions: [],
}).write();

function sendNotifications(subscriptions) {
  // TODO
}

const app = express();
app.use(bodyparser.json());
app.use(express.static("public"));

app.post("/add-subscription", (request, response) => {
  console.log("/add-subscription");
  console.log(request.body);
  console.log(`Subscribing ${request.body.endpoint}`);
  db.get("subscriptions").push(request.body).write();
  response.sendStatus(200);
  response.sendStatus(200);
});

app.post("/remove-subscription", (request, response) => {
  console.log("/remove-subscription");
  console.log(request.body);
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
