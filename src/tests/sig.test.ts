import fc from 'fast-check';
import { createSignature, createStackingClient } from '../utils/signature';
import { getPoxRewardCycle, randomAuthId } from '../utils/helpers';
import { Pox4SignatureTopic, StackingClient } from '@stacks/stacking';

const topicOptions = [
  'stack-stx',
  'stack-extend',
  'stack-increase',
  'agg-commit',
  'agg-increase',
];

let stackingClient: StackingClient | undefined; // Define stackingClient globally
const prvKey =
  'b41c2a9e65247e73a690dbef18622c04cfa1df276bb65ee77ed73cc876e3e77b01';

// List of valid btcAddresses
const btcAddresses: string[] = ['mqVnk6NPRdhntvfm4hh9vvjiRkFDUuSYsH'];

beforeAll(() => {
  stackingClient = createStackingClient(
    'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
    'mainnet'
  );
});

describe('Signature generation', () => {
  it('should generate a valid signature for mainnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...topicOptions),
        fc.constantFrom(...btcAddresses), // replace with actual btc addresses
        fc.integer(), // replace with correct reward cycle (using chain)
        fc.integer(),
        fc.integer(),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClient).toBeDefined();
          const authId = randomAuthId();
          const curCycle = await getPoxRewardCycle(
            stackingClient as StackingClient
          );
          expect(curCycle).toBeGreaterThanOrEqual(85);

          // Act
          const signature = createSignature(
            stackingClient as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Assert
          expect(true).toBe(true);
        }
      )
    );
  });
});
