const { onRequest } = require("firebase-functions/v2/https");

const app = require("./server");

exports.api = onRequest(
  {
    region: "europe-west1",
    memory: "1GiB",
    timeoutSeconds: 120,
  },
  app
);
