const parseTimeLength = (timeLength: string): number => {
  const timeLengthNumber = Number(timeLength);
  if (isNaN(timeLengthNumber)) {
    throw new Error(`The parameter timeLength: ${timeLength} is not a number`);
  }
  return timeLengthNumber;
};

const parseFee = (fee: string): number => {
  const feeNumber = Number(fee);
  if (isNaN(feeNumber)) {
    throw new Error(`The parameter fee: ${fee} is not a number`);
  }
  return feeNumber;
};

const parseUntilWon = (untilWon: string): boolean => {
  const untilWonBoolean = JSON.parse(untilWon);
  if (typeof untilWonBoolean !== "boolean") {
    throw new Error(`The parameter untilWon: ${untilWon} is not a boolean`);
  }
  return untilWonBoolean;
};

export const createLotto = async (
  contract: any,
  timeLength: string,
  fee: string,
  untilWon: string
) => {
  try {
    await contract.createLotto(
      parseTimeLength(timeLength),
      parseFee(fee),
      parseUntilWon(untilWon)
    );
  } catch (error: any) {
    throw new Error(
      `Error creating lotto with parameters timeLength: ${timeLength}, fee: ${fee}, untilWon: ${untilWon}. Reason: ${
        error.message + JSON.stringify(error.data?.data?.stack)
      }`
    );
  }
};
