export const getWinners = async (
  contract: any
): Promise<string[]> => {
  try {
    const winners = await contract.getWinners();
    if (winners.length === 0) {
      return ["No winners yet"];
    }
    return winners;
  } catch (error: any) {
    throw new Error(
      `Error getting the lotto winners. Reason: ${error.message}`
    );
  }
};
