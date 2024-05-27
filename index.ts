// index.js
const express = require("express");
const cors = require("cors");
const app = express();
const port = 8080;

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

// Define a route for the homepage
app.get("/", (req, res) => {
  res.send("Hello, signer!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

app.post("/get-signature", (req, res) => {
  console.log(req.body);
  const { rewardCycle, poxAddress, maxAmount, period, topic } = req.body;
  // Do something with the data, such as saving it to a database
  console.log(
    "Received data:",
    rewardCycle,
    poxAddress,
    maxAmount,
    period,
    topic
  );
  res.status(200).json({ message: "Data received successfully" });
});
