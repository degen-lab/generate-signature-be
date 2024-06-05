import { StackingClient } from "@stacks/stacking";
import validate from "bitcoin-address-validation";

const TopicMapping: string[] = [
  "stack-stx",
  "stack-extend",
  "stack-increase",
  "stack-aggregation-commit",
  "stack-aggregation-increase",
];

export const randomAuthId = () => {
  return Date.now();
};

export const validateParams = async (
  poxAddress: string,
  topic: string,
  selectedRewardCycle: number | undefined,
  maxAmount: number,
  period: number,
  stackingClient: StackingClient
) => {
  let currentRewardCycle = await getPoxRewardCycle(stackingClient);

  if (!validate(poxAddress))
    return [false, SigFormErrorMessages.InvalidPoxAddress(poxAddress)];

  if (!TopicMapping.includes(topic))
    return [false, SigFormErrorMessages.InvalidTopic(topic)];

  if (maxAmount > Number.MAX_SAFE_INTEGER)
    return [false, SigFormErrorMessages.MaxAmountTooBig(maxAmount)];

  const [rewardCycleValid, rewardCycleMessage] = testRewardCycle(
    topic,
    currentRewardCycle,
    selectedRewardCycle
  );

  const [periodValid, periodMessage] = testPeriod(topic, period);

  if (!rewardCycleValid) return [false, rewardCycleMessage];

  if (!periodValid) return [false, periodMessage];

  return [true, "OK"];
};

export const SigFormErrorMessages = {
  EmptyRewardCycle: "Please add the reward cycle.",
  PastRewCycle: "Past reward cycles are not permitted.",
  AggFutureCycle: "For the selected topic you must insert a future cycle.",
  WrongTopic: "Please select a valid topic.",
  EmptyPeriod: "Please add the period.",
  NegativeOrZeroPeriod:
    "Period should be greater than 0 for the selected topic.",
  PeriodExceedsMaximum: "The maximum period for stacking operations is 12.",
  AggCommitWrongPeriod: (topic: string) =>
    `The period for ${topic} signature should be 1.`,
  InvalidPoxAddress: (poxAddress: string) =>
    `Invalid PoX Address: ${poxAddress}.`,
  InvalidTopic: (topic: string) => `Invalid Topic: ${topic}.`,
  MaxAmountTooBig: (maxAmount: number) =>
    `Max amount too big (${maxAmount} > ${Number.MAX_SAFE_INTEGER}).`,
  RewCycleGreaterThanCurrent: (currentRewardCycle: number) =>
    `The reward cycle is greater than the current one (${currentRewardCycle}).`,
};

/**
 * Reward Cycle validator for a given topic.
 * @param topic The topic of the signature request.
 * @param currentRewardCycle The current reward cycle.
 * @param selectedRewardCycle The reward cycle selected by the user.
 */
export const testRewardCycle = (
  topic: string,
  currentRewardCycle: number,
  selectedRewardCycle: number | undefined
): [boolean, string] => {
  const topicMapping: Record<
    string,
    (selectedRewardCycle: number) => [boolean, string]
  > = {
    [TopicMapping[0]]: (selectedRewardCycle: number): [boolean, string] => {
      if (!selectedRewardCycle)
        return [false, SigFormErrorMessages.EmptyRewardCycle];
      if (selectedRewardCycle < currentRewardCycle)
        return [false, SigFormErrorMessages.PastRewCycle];
      if (selectedRewardCycle > currentRewardCycle)
        return [
          false,
          SigFormErrorMessages.RewCycleGreaterThanCurrent(currentRewardCycle),
        ];
      return [true, "OK"];
    },
    [TopicMapping[1]]: (selectedRewardCycle: number): [boolean, string] => {
      if (!selectedRewardCycle)
        return [false, SigFormErrorMessages.EmptyRewardCycle];
      if (selectedRewardCycle < currentRewardCycle)
        return [false, SigFormErrorMessages.PastRewCycle];
      if (selectedRewardCycle > currentRewardCycle)
        return [
          false,
          SigFormErrorMessages.RewCycleGreaterThanCurrent(currentRewardCycle),
        ];
      return [true, "OK"];
    },
    [TopicMapping[2]]: (selectedRewardCycle: number): [boolean, string] => {
      if (!selectedRewardCycle)
        return [false, SigFormErrorMessages.EmptyRewardCycle];
      if (selectedRewardCycle < currentRewardCycle)
        return [false, SigFormErrorMessages.PastRewCycle];
      if (selectedRewardCycle > currentRewardCycle)
        return [
          false,
          SigFormErrorMessages.RewCycleGreaterThanCurrent(currentRewardCycle),
        ];
      return [true, "OK"];
    },
    [TopicMapping[3]]: (selectedRewardCycle: number): [boolean, string] => {
      if (!selectedRewardCycle)
        return [false, SigFormErrorMessages.EmptyRewardCycle];
      if (selectedRewardCycle <= currentRewardCycle)
        return [false, SigFormErrorMessages.AggFutureCycle];
      return [true, "OK"];
    },
    [TopicMapping[4]]: (selectedRewardCycle: number): [boolean, string] => {
      if (!selectedRewardCycle)
        return [false, SigFormErrorMessages.EmptyRewardCycle];
      if (selectedRewardCycle <= currentRewardCycle)
        return [false, SigFormErrorMessages.AggFutureCycle];
      return [true, "OK"];
    },
  };

  const validate = topicMapping[topic];
  if (validate) {
    if (!selectedRewardCycle)
      return [false, SigFormErrorMessages.EmptyRewardCycle];
    return validate(selectedRewardCycle);
  }

  return [false, SigFormErrorMessages.WrongTopic];
};

/**
 * Period validator for a given topic.
 * @param topic The topic of the signature request.
 * @param selectedPeriod The period selected by the user.
 */
export const testPeriod = (
  topic: string,
  selectedPeriod: number | undefined
): [boolean, string] => {
  const topicMapping: Record<
    string,
    (selectedRewardCycle: number) => [boolean, string]
  > = {
    [TopicMapping[0]]: (selectedPeriod: number): [boolean, string] => {
      if (selectedPeriod === undefined)
        return [false, SigFormErrorMessages.EmptyPeriod];
      if (selectedPeriod < 1)
        return [false, SigFormErrorMessages.NegativeOrZeroPeriod];
      if (selectedPeriod > 12)
        return [false, SigFormErrorMessages.PeriodExceedsMaximum];
      return [true, "OK"];
    },
    [TopicMapping[1]]: (selectedPeriod: number): [boolean, string] => {
      if (selectedPeriod === undefined)
        return [false, SigFormErrorMessages.EmptyPeriod];
      if (selectedPeriod < 1)
        return [false, SigFormErrorMessages.NegativeOrZeroPeriod];
      if (selectedPeriod > 12)
        return [false, SigFormErrorMessages.PeriodExceedsMaximum];
      return [true, "OK"];
    },
    [TopicMapping[2]]: (): [boolean, string] => {
      // TODO: Should be equal to current lock period!
      if (selectedPeriod === undefined)
        return [false, SigFormErrorMessages.EmptyPeriod];
      if (selectedPeriod < 1)
        return [false, SigFormErrorMessages.NegativeOrZeroPeriod];
      if (selectedPeriod > 12)
        return [false, SigFormErrorMessages.PeriodExceedsMaximum];
      return [true, "OK"];
    },
    [TopicMapping[3]]: (selectedPeriod: number): [boolean, string] => {
      if (selectedPeriod === undefined)
        return [false, SigFormErrorMessages.EmptyPeriod];
      if (selectedPeriod !== 1)
        return [false, SigFormErrorMessages.AggCommitWrongPeriod(topic)];
      return [true, "OK"];
    },
    [TopicMapping[4]]: (selectedPeriod: number): [boolean, string] => {
      if (selectedPeriod === undefined)
        return [false, SigFormErrorMessages.EmptyPeriod];
      if (selectedPeriod !== 1)
        return [false, SigFormErrorMessages.AggCommitWrongPeriod(topic)];
      return [true, "OK"];
    },
  };

  const validate = topicMapping[topic];
  if (validate) {
    if (selectedPeriod === undefined)
      return [false, SigFormErrorMessages.EmptyPeriod];
    return validate(selectedPeriod);
  }

  return [false, SigFormErrorMessages.WrongTopic];
};

export const getPoxRewardCycle = async (stackingClient: StackingClient) => {
  return (await stackingClient.getPoxInfo()).reward_cycle_id;
};
