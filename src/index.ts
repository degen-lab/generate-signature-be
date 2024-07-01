import express from 'express';
import cors from 'cors';
import {
  validateParams,
  randomAuthId,
  methodToPox4Topic as methodToSigTopic,
} from './utils/helpers';
import { createSignature, createStackingClient } from './utils/signature';
import dotenv from 'dotenv';
import { Pox4SignatureTopic } from '@stacks/stacking';
import { MAX_ALLOWED_STX_AMOUNT } from './utils/constants';
const app = express();
const port = 8080;
dotenv.config();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://generate-signature-fe.vercel.app',
];
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, signer!');
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

app.post('/get-signature', async (req, res) => {
  console.log(req.body);
  const { rewardCycle, poxAddress, maxAmount, period, topic } = req.body;

  if (maxAmount > MAX_ALLOWED_STX_AMOUNT) {
    console.error(
      `The provided STX amount ${maxAmount} is greater than the maximum allowed amount ${MAX_ALLOWED_STX_AMOUNT}`
    );
    res.status(400).json({
      message: `The provided STX amount ${maxAmount} is greater than the maximum allowed amount ${MAX_ALLOWED_STX_AMOUNT}`,
    });
    return;
  }

  const signerPrivateKey = process.env.SIGNER_PRV_KEY;
  const signerPublicKey = process.env.SIGNER_PUB_KEY;
  const signerAddress = process.env.SIGNER_ADDRESS;
  const network = process.env.NETWORK;
  const sigTopic: Pox4SignatureTopic | undefined = methodToSigTopic[topic];

  if (!sigTopic) {
    console.error('Invalid Signature Topic:', topic);
    res.status(400).json({ message: `Invalid Signature Topic: ${topic}` });
    return;
  }

  if (!signerPrivateKey || !signerAddress || !network) {
    console.error(
      'Invalid Signer Data:',
      signerPrivateKey,
      signerAddress,
      network
    );
    res.status(400).json({ message: 'Invalid Signer Data' });
    return;
  }

  const authId = randomAuthId();
  const stackingClient = createStackingClient(
    process.env.SIGNER_ADDRESS,
    process.env.NETWORK
  );

  if (!stackingClient) {
    res.status(400).json({ message: 'Invalid Internal Info' });
    return;
  }

  const [valid, message] = await validateParams(
    poxAddress,
    sigTopic,
    rewardCycle,
    maxAmount,
    period,
    stackingClient
  );

  console.log('\n\n', valid, message, '\n\n');

  if (!valid) {
    res.status(400).json({ message });
    return;
  }

  const signature = createSignature(
    stackingClient,
    sigTopic,
    poxAddress,
    rewardCycle,
    period,
    signerPrivateKey,
    maxAmount * 1_000_000,
    authId
  );

  console.log(
    'Received data:',
    `rewardCycle: ${rewardCycle}`,
    `poxAddress ${poxAddress}`,
    `maxAmount (in uSTX): ${maxAmount * 1_000_000}`,
    `period: ${period}`,
    `topic: ${sigTopic}`,
    `authId: ${authId}`
  );

  console.log('sending response: ', {
    signature,
    signerPublicKey,
    authId,
    maxAmount,
  });

  res.status(200).json({
    signature,
    signerPublicKey,
    authId,
    maxAmount,
  });
});
