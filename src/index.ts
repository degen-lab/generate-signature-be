import express from "express";
import cors from "cors";
import { randomAuthId } from "./utils/helpers";
import { createSignature, createStackingClient } from "./utils/signature";
import dotenv from "dotenv";
const app = express();
const port = 8080;
dotenv.config();

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, signer!");
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

app.post("/get-signature", (req, res) => {
  console.log(req.body);
  const { rewardCycle, poxAddress, maxAmount, period, topic } = req.body;
  const signerPrivateKey = process.env.SIGNER_PRV_KEY;
  const signerPublicKey = process.env.SIGNER_PUB_KEY;
  const signerAddress = process.env.SIGNER_ADDRESS;
  const network = process.env.NETWORK;

  if (!signerPrivateKey || !signerAddress || !network) {
    console.error(
      "Invalid Signer Data:",
      signerPrivateKey,
      signerAddress,
      network
    );
    res.status(400).json({ message: "Invalid Signer Data" });
    return;
  }

  const authId = randomAuthId();
  const stackingClient = createStackingClient(
    process.env.SIGNER_ADDRESS,
    process.env.NETWORK
  );

  if (!stackingClient) {
    res.status(400).json({ message: "Invalid Internal Info" });
    return;
  }
  const signature = createSignature(
    stackingClient,
    topic,
    poxAddress,
    rewardCycle,
    period,
    signerPrivateKey,
    maxAmount,
    authId
  );
  console.log(
    "Received data:",
    rewardCycle,
    poxAddress,
    maxAmount,
    period,
    topic,
    authId
  );
  console.log("Signature:", signature);

  res.status(200).json({
    signature,
    signerPublicKey,
    authId,
    maxAmount,
  });
});
