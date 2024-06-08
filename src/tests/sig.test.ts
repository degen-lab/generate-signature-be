import fc from 'fast-check';
import {
  createStackingClient,
} from '../utils/signature';
import {
  SigFormErrorMessages,
  getPoxRewardCycle,
  randomAuthId,
  validateParams,
} from '../utils/helpers';
import {
  Pox4SignatureTopic,
  StackingClient,
  poxAddressToTuple,
} from '@stacks/stacking';
import {
  btcAddressToPoxAddress,
  buildSignerKeyMessageHash,
  createSignatureTest,
  signMessageHash,
} from './testHelpers';
import { Cl, callReadOnlyFunction } from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

export const topicOptions = [
  'stack-stx',
  'stack-extend',
  'stack-increase',
  'agg-commit',
  'agg-increase',
];

const TopicList: string[] = [
  'stack-stx',
  'stack-extend',
  'stack-increase',
  'stack-aggregation-commit',
  'stack-aggregation-increase',
];

fc.configureGlobal({ numRuns: 5, endOnFailure: true });
let stackingClientMainnet: StackingClient | undefined;
let stackingClientTestnet: StackingClient | undefined;
let prvKey =
  'b41c2a9e65247e73a690dbef18622c04cfa1df276bb65ee77ed73cc876e3e77b01';
let pubKey =
  '02778d476704afa540ac01438f62c371dc38741b00f35fb895e5cd48d070ebab41';

const btcAddresses: string[] = [
  'mqVnk6NPRdhntvfm4hh9vvjiRkFDUuSYsH',
  'mr1iPkD9N3RJZZxXRk7xF9d36gffa6exNC',
  'muYdXKmX9bByAueDe6KFfHd5Ff1gdN9ErG',
  'mvZtbibDAAA3WLpY7zXXFqRa3T4XSknBX7',
  'mg1C76bNTutiCDV3t9nWhZs3Dc8LzUufj8',
  'mweN5WVqadScHdA81aATSdcVr4B6dNokqx',
];

const btcAddressesMalformed: string[] = [
  'mqVnk6NPRdhntvfm4hh9vvjiRkFDUuSYsHf',
  'mr1iPkD9N3RJZZxXRk7xF9d36gffa6exNCs',
  'muYdXKmX9bByAueDe6KFfHd5Ff1gdN9ErGh',
  'mvZtbibDAAA3WLpY7zXXFqRa3T4XSknBX74',
  'mg1C76bNTutiCDV3t9nWhZs3Dc8LzUufj8d',
  'mweN5WVqadScHdA81aATSdcVr4B6dNokqxs',
];

const MAINNET_CHAIN_ID = 1;
const TESTNET_CHAIN_ID = 2147483648;

describe('Signature generation', () => {
  let curCycleMainnet = 0;
  let curCycleTestnet = 0;
  beforeAll(async () => {
    stackingClientMainnet = createStackingClient(
      'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
      'mainnet'
    )!;
    curCycleMainnet = await getPoxRewardCycle(stackingClientMainnet);
    stackingClientTestnet = createStackingClient(
      'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
      'testnet'
    )!;
    curCycleTestnet = await getPoxRewardCycle(stackingClientTestnet);
  });

  it('should generate a valid signature for mainnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...topicOptions),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();
          const { version, hashBytes } = btcAddressToPoxAddress(poxAddress);
          const sig = buildSignerKeyMessageHash(
            version,
            hashBytes,
            rewardCycle,
            topic,
            period,
            maxAmount,
            authId,
            MAINNET_CHAIN_ID
          );
          const expected = signMessageHash(prvKey, sig).toString('hex');

          // Act
          const actual = createSignatureTest(
            stackingClientMainnet as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Assert
          expect(actual).toEqual(expected);
        }
      )
    );
  });

  it('should generate a valid signature for testnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...topicOptions),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();
          const { version, hashBytes } = btcAddressToPoxAddress(poxAddress);
          const sig = buildSignerKeyMessageHash(
            version,
            hashBytes,
            rewardCycle,
            topic,
            period,
            maxAmount,
            authId,
            TESTNET_CHAIN_ID
          );
          const expected = signMessageHash(prvKey, sig).toString('hex');

          // Act
          const actual = createSignatureTest(
            stackingClientTestnet as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Assert
          expect(actual).toEqual(expected);
        }
      )
    );
  });

  // stack-stx, stack-extend, stack-increase
  it('create stack-stx, stack-extend, stack-increase signature for mainnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0], topicOptions[1], topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();
          const signature = createSignatureTest(
            stackingClientMainnet as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Act
          const options = {
            contractAddress: 'SP000000000000000000002Q6VF78',
            contractName: 'pox-4',
            functionName: 'verify-signer-key-sig',
            functionArgs: [
              poxAddressToTuple(poxAddress),
              Cl.uint(curCycleMainnet),
              Cl.stringAscii(topic),
              Cl.uint(period),
              Cl.some(Cl.bufferFromHex(signature)),
              Cl.bufferFromHex(pubKey),
              Cl.uint(maxAmount),
              Cl.uint(maxAmount),
              Cl.uint(authId),
            ],
            network: new StacksMainnet(),
            senderAddress: 'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
          };
          const result = await callReadOnlyFunction(options);
          // Assert
          expect(result).toStrictEqual(Cl.ok(Cl.bool(true)));
        }
      )
    );
  });

  it('create stack-stx, stack-extend, stack-increase signature for testnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0], topicOptions[1], topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();
          const signature = createSignatureTest(
            stackingClientTestnet as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Act
          const options = {
            contractAddress: 'ST000000000000000000002AMW42H',
            contractName: 'pox-4',
            functionName: 'verify-signer-key-sig',
            functionArgs: [
              poxAddressToTuple(poxAddress),
              Cl.uint(curCycleTestnet),
              Cl.stringAscii(topic),
              Cl.uint(period),
              Cl.some(Cl.bufferFromHex(signature)),
              Cl.bufferFromHex(pubKey),
              Cl.uint(maxAmount),
              Cl.uint(maxAmount),
              Cl.uint(authId),
            ],
            network: new StacksTestnet(),
            senderAddress: 'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
          };
          const result = await callReadOnlyFunction(options);
          // Assert
          expect(result).toStrictEqual(Cl.ok(Cl.bool(true)));
        }
      )
    );
  });

  // agg-commit
  it('create agg-commit signature for mainnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[3]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();
          const signature = createSignatureTest(
            stackingClientMainnet as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Act
          const options = {
            contractAddress: 'SP000000000000000000002Q6VF78',
            contractName: 'pox-4',
            functionName: 'verify-signer-key-sig',
            functionArgs: [
              poxAddressToTuple(poxAddress),
              Cl.uint(curCycleMainnet),
              Cl.stringAscii(topicOptions[3]),
              Cl.uint(period),
              Cl.some(Cl.bufferFromHex(signature)),
              Cl.bufferFromHex(pubKey),
              Cl.uint(maxAmount),
              Cl.uint(maxAmount),
              Cl.uint(authId),
            ],
            network: new StacksMainnet(),
            senderAddress: 'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
          };
          const result = await callReadOnlyFunction(options);
          // Assert
          expect(result).toStrictEqual(Cl.ok(Cl.bool(true)));
        }
      )
    );
  });

  it('create agg-commit signature for testnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[3]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();
          const signature = createSignatureTest(
            stackingClientTestnet as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Act
          const options = {
            contractAddress: 'ST000000000000000000002AMW42H',
            contractName: 'pox-4',
            functionName: 'verify-signer-key-sig',
            functionArgs: [
              poxAddressToTuple(poxAddress),
              Cl.uint(curCycleTestnet),
              Cl.stringAscii(topicOptions[3]),
              Cl.uint(period),
              Cl.some(Cl.bufferFromHex(signature)),
              Cl.bufferFromHex(pubKey),
              Cl.uint(maxAmount),
              Cl.uint(maxAmount),
              Cl.uint(authId),
            ],
            network: new StacksTestnet(),
            senderAddress: 'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
          };
          const result = await callReadOnlyFunction(options);
          // Assert
          expect(result).toStrictEqual(Cl.ok(Cl.bool(true)));
        }
      )
    );
  });

  // agg-increase
  it('create agg-increase signature for mainnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[4]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();
          const signature = createSignatureTest(
            stackingClientMainnet as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Act
          const options = {
            contractAddress: 'SP000000000000000000002Q6VF78',
            contractName: 'pox-4',
            functionName: 'verify-signer-key-sig',
            functionArgs: [
              poxAddressToTuple(poxAddress),
              Cl.uint(curCycleMainnet),
              Cl.stringAscii(topicOptions[4]),
              Cl.uint(period),
              Cl.some(Cl.bufferFromHex(signature)),
              Cl.bufferFromHex(pubKey),
              Cl.uint(maxAmount),
              Cl.uint(maxAmount),
              Cl.uint(authId),
            ],
            network: new StacksMainnet(),
            senderAddress: 'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
          };
          const result = await callReadOnlyFunction(options);
          // Assert
          expect(result).toStrictEqual(Cl.ok(Cl.bool(true)));
        }
      )
    );
  });

  it('create agg-increase signature for testnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[4]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();
          const signature = createSignatureTest(
            stackingClientTestnet as StackingClient,
            topic as Pox4SignatureTopic,
            poxAddress,
            rewardCycle,
            period,
            prvKey,
            maxAmount,
            authId
          );

          // Act
          const options = {
            contractAddress: 'ST000000000000000000002AMW42H',
            contractName: 'pox-4',
            functionName: 'verify-signer-key-sig',
            functionArgs: [
              poxAddressToTuple(poxAddress),
              Cl.uint(curCycleTestnet),
              Cl.stringAscii(topicOptions[4]),
              Cl.uint(period),
              Cl.some(Cl.bufferFromHex(signature)),
              Cl.bufferFromHex(pubKey),
              Cl.uint(maxAmount),
              Cl.uint(maxAmount),
              Cl.uint(authId),
            ],
            network: new StacksTestnet(),
            senderAddress: 'STGV0HNRP9XMMQ3Y1PW1Q7QQERVT37R3RPADMHFP',
          };
          const result = await callReadOnlyFunction(options);

          // Assert
          expect(result).toStrictEqual(Cl.ok(Cl.bool(true)));
        }
      )
    );
  });

  it('create stack-stx sig for mainnet, larger period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ min: 13 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PeriodExceedsMaximum,
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for testnet, larger period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ min: 13 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PeriodExceedsMaximum,
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for mainnet, negative or zero period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ max: 0 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.NegativeOrZeroPeriod,
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for testnet, negative or zero period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ max: 0 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.NegativeOrZeroPeriod,
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for mainnet, past reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet - 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PastRewCycle,
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for testnet, past reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet - 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PastRewCycle,
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for mainnet, reward cycle greater than current', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet + 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.RewCycleGreaterThanCurrent(curCycleMainnet),
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for testnet, reward cycle greater than current', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet + 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.RewCycleGreaterThanCurrent(curCycleTestnet),
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for mainnet, undefined reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create stack-stx sig for testnet, undefined reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[0]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[0],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for mainnet, larger period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ min: 13 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PeriodExceedsMaximum,
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for testnet, larger period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ min: 13 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PeriodExceedsMaximum,
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for mainnet, negative or zero period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ max: 0 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.NegativeOrZeroPeriod,
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for testnet, negative or zero period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ max: 0 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.NegativeOrZeroPeriod,
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for mainnet, past reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet - 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PastRewCycle,
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for testnet, past reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet - 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PastRewCycle,
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for mainnet, reward cycle greater than current', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet + 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.RewCycleGreaterThanCurrent(curCycleMainnet),
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for testnet, reward cycle greater than current', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet + 1);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.RewCycleGreaterThanCurrent(curCycleTestnet),
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for mainnet, undefined reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create stack-extend sig for testnet, undefined reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[1]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[1],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for mainnet, larger period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ min: 13 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PeriodExceedsMaximum,
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for testnet, larger period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ min: 13 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PeriodExceedsMaximum,
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for mainnet, negative or zero period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ max: 0 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.NegativeOrZeroPeriod,
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for testnet, negative or zero period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ max: 0 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.NegativeOrZeroPeriod,
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for mainnet, past reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet - 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PastRewCycle,
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for testnet, past reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet - 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.PastRewCycle,
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for mainnet, reward cycle greater than current', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet + 1);
        }),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.RewCycleGreaterThanCurrent(curCycleMainnet),
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for testnet, reward cycle greater than current', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet + 1);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.RewCycleGreaterThanCurrent(curCycleTestnet),
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for mainnet, undefined reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create stack-increase sig for testnet, undefined reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[2]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();
          const authId = randomAuthId();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[2],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create agg-commit sig for mainnet, wrong period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[3]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet + 1);
        }),
        fc.integer().filter((n) => n !== 1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[3],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.AggCommitWrongPeriod(TopicList[3]),
          ]);
        }
      )
    );
  });

  it('create agg-commit sig for testnet, wrong period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[3]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet + 1);
        }),
        fc.integer().filter((n) => n !== 1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[3],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.AggCommitWrongPeriod(TopicList[3]),
          ]);
        }
      )
    );
  });

  it('create agg-commit sig for mainnet, not future reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[3]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[3],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.AggFutureCycle,
          ]);
        }
      )
    );
  });

  it('create agg-commit sig for testnet, not future reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[3]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[3],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.AggFutureCycle,
          ]);
        }
      )
    );
  });

  it('create agg-commit sig for mainnet, undefiend reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[3]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[3],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create agg-commit sig for testnet, undefiend reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[3]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[3],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create agg-increase sig for mainnet, wrong period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[4]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet + 1);
        }),
        fc.integer().filter((n) => n !== 1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[4],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.AggCommitWrongPeriod(TopicList[4]),
          ]);
        }
      )
    );
  });

  it('create agg-increase sig for testnet, wrong period', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[4]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet + 1);
        }),
        fc.integer().filter((n) => n !== 1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[4],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.AggCommitWrongPeriod(TopicList[4]),
          ]);
        }
      )
    );
  });

  it('create agg-increase sig for mainnet, not future reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[4]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[4],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.AggFutureCycle,
          ]);
        }
      )
    );
  });

  it('create agg-increase sig for testnet, not future reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[4]),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[4],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.AggFutureCycle,
          ]);
        }
      )
    );
  });

  it('create agg-increase sig for mainnet, undefiend reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[4]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[4],
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create agg-increase sig for testnet, undefiend reward cycle', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(topicOptions[4]),
        fc.constantFrom(...btcAddresses),
        fc.constant(undefined),
        fc.constant(1),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            TopicList[4],
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.EmptyRewardCycle,
          ]);
        }
      )
    );
  });

  it('create non-existing topic sig, mainnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string(),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            topic,
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.InvalidTopic(topic),
          ]);
        }
      )
    );
  });

  it('create non-existing topic sig, testnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string(),
        fc.constantFrom(...btcAddresses),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            topic,
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.InvalidTopic(topic),
          ]);
        }
      )
    );
  });

  it('create invalid btcAddress sig, mainnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...topicOptions),
        fc.constantFrom(...btcAddressesMalformed),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleMainnet);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientMainnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            topic,
            rewardCycle,
            maxAmount,
            period,
            stackingClientMainnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.InvalidPoxAddress(poxAddress),
          ]);
        }
      )
    );
  });

  it('create invalid btcAddress sig, testnet', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...topicOptions),
        fc.constantFrom(...btcAddressesMalformed),
        fc.integer().chain((rewardCycle) => {
          return fc.constant(curCycleTestnet);
        }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0 }),
        async (topic, poxAddress, rewardCycle, period, maxAmount) => {
          // Arrange
          expect(stackingClientTestnet).toBeDefined();

          // Act
          const message = await validateParams(
            poxAddress,
            topic,
            rewardCycle,
            maxAmount,
            period,
            stackingClientTestnet!
          );

          // Assert
          expect(message).toStrictEqual([
            false,
            SigFormErrorMessages.InvalidPoxAddress(poxAddress),
          ]);
        }
      )
    );
  });
});
