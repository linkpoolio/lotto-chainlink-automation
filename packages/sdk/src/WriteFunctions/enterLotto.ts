export const parseNumbers = (numbers: string): number[] => {
  try {
    const numbersArray = JSON.parse(numbers);
    if (!Array.isArray(numbersArray)) {
      throw new Error(`The parameter numbers: ${numbers} is not an array`);
    }
    return numbersArray;
  } catch (error: any) {
    throw new Error(`The parameter numbers: ${numbers} is not a valid JSON`);
  }
};

export const parseFee = (fee: string): number => {
  const feeNumber = Number(fee);
  if (isNaN(feeNumber)) {
    throw new Error(`The parameter fee: ${fee} is not a number`);
  }
  return feeNumber;
};

export const enterLotto = async (
  contract: any,
  numbers: string,
  fee: string
) => {
  try {
    await contract.enterLotto(parseNumbers(numbers), {
      value: parseFee(fee),
    });
  } catch (error: any) {
    throw new Error(
      `Error entering lotto with parameter numbers: ${numbers}. Reason: ${
        error.message + JSON.stringify(error.data?.data?.stack)
      }`
    );
  }
};
