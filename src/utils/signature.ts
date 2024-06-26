import { Pox4SignatureTopic, StackingClient } from '@stacks/stacking';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { createStacksPrivateKey } from '@stacks/transactions';

export const createStackingClient = (
  address: string | undefined,
  network: string | undefined
): StackingClient | undefined => {
  if (!address || !network) {
    return undefined;
  }
  const stacksNetwork =
    network?.toLowerCase() === 'nakamoto-testnet'
      ? new StacksTestnet({ url: 'https://api.nakamoto.testnet.hiro.so' })
      : network?.toLowerCase() === 'testnet'
      ? new StacksTestnet()
      : new StacksMainnet();
  return new StackingClient(address as string, stacksNetwork);
};

export const createSignature = (
  stackingClient: StackingClient,
  topic: Pox4SignatureTopic,
  poxAddress: string,
  rewardCycle: number,
  period: number,
  signerPrivateKey: string,
  maxAmountUSTX: number,
  authId: number
) => {
  return stackingClient.signPoxSignature({
    topic,
    poxAddress,
    rewardCycle,
    period,
    signerPrivateKey: createStacksPrivateKey(signerPrivateKey),
    maxAmount: maxAmountUSTX,
    authId,
  });
};
