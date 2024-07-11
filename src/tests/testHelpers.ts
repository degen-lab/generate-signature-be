import { Pox4SignatureTopic, StackingClient } from '@stacks/stacking';
import {
  AddressHashMode,
  Cl,
  ClarityValue,
  createStacksPrivateKey,
  serializeCV,
  signWithKey,
} from '@stacks/transactions';
import bs58check from 'bs58check';
import { createHash } from 'crypto';

const sha256 = (data: Buffer): Buffer =>
  createHash('sha256').update(data).digest();

const structuredDataHash = (structuredData: ClarityValue): Buffer =>
  sha256(Buffer.from(serializeCV(structuredData)));

const generateDomainHash = (chainId: number): ClarityValue =>
  Cl.tuple({
    name: Cl.stringAscii('pox-4-signer'),
    version: Cl.stringAscii('1.0.0'),
    'chain-id': Cl.uint(chainId),
  });

const generateMessageHash = (
  version: number,
  hashbytes: number[],
  reward_cycle: number,
  topic: string,
  period: number,
  auth_id: string,
  max_amount: string
): ClarityValue =>
  Cl.tuple({
    'pox-addr': Cl.tuple({
      version: Cl.buffer(Uint8Array.from([version])),
      hashbytes: Cl.buffer(Uint8Array.from(hashbytes)),
    }),
    'reward-cycle': Cl.uint(reward_cycle),
    topic: Cl.stringAscii(topic),
    period: Cl.uint(period),
    'auth-id': Cl.uint(auth_id),
    'max-amount': Cl.uint(max_amount),
  });

const generateMessagePrefixBuffer = (prefix: string) =>
  Buffer.from(prefix, 'hex');

const SIP_018_MESSAGE_PREFIX = '534950303138';

export const buildSignerKeyMessageHash = (
  version: number,
  hashbytes: number[],
  reward_cycle: number,
  topic: string,
  period: number,
  max_amount: string,
  auth_id: string,
  chainId: number
) => {
  const domain_hash = structuredDataHash(generateDomainHash(chainId));
  const message_hash = structuredDataHash(
    generateMessageHash(
      version,
      hashbytes,
      reward_cycle,
      topic,
      period,
      auth_id,
      max_amount
    )
  );
  const structuredDataPrefix = generateMessagePrefixBuffer(
    SIP_018_MESSAGE_PREFIX
  );

  const signer_key_message_hash = sha256(
    Buffer.concat([structuredDataPrefix, domain_hash, message_hash])
  );

  return signer_key_message_hash;
};

export const signMessageHash = (privateKey: string, messageHash: Buffer) => {
  const data = signWithKey(
    createStacksPrivateKey(privateKey),
    messageHash.toString('hex')
  ).data;
  return Buffer.from(data.slice(2) + data.slice(0, 2), 'hex');
};

function decodeBitcoinAddress(btcAddress: string) {
  const payload = bs58check.decode(btcAddress);

  if (payload.length !== 21) {
    throw new Error('Invalid address length');
  }

  const version = payload[0];
  const hashBytes = payload.slice(1);

  return { version, hashBytes };
}

// Function to convert a Bitcoin address to a PoX address
export function btcAddressToPoxAddress(btcAddress: string) {
  const { version, hashBytes } = decodeBitcoinAddress(btcAddress);

  let poxVersion;

  // Determine the PoX version based on the Bitcoin address version
  switch (version) {
    case 0x00: // P2PKH
      poxVersion = AddressHashMode.SerializeP2PKH;
      break;
    case 0x05: // P2SH
      poxVersion = AddressHashMode.SerializeP2SH;
      break;
    case 0x6f: // Testnet P2PKH
      poxVersion = AddressHashMode.SerializeP2PKH;
      break;
    case 0xc4: // Testnet P2SH
      poxVersion = AddressHashMode.SerializeP2SH;
      break;
    default:
      throw new Error('Unsupported Bitcoin address version');
  }

  return { version: poxVersion, hashBytes: Array.from(hashBytes) };
}

export const createSignatureTest = (
  stackingClient: StackingClient,
  topic: Pox4SignatureTopic,
  poxAddress: string,
  rewardCycle: number,
  period: number,
  signerPrivateKey: string,
  maxAmount: string,
  authId: string
) => {
  return stackingClient.signPoxSignature({
    topic,
    poxAddress,
    rewardCycle,
    period,
    signerPrivateKey: createStacksPrivateKey(signerPrivateKey),
    maxAmount,
    authId,
  });
};
