import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import Lotto from "sdk/src/abi/contracts/Lotto.sol/Lotto.json";
import { createLotto } from "sdk/src/WriteFunctions/createLotto";

function CreateLotto() {
  const [contractAddress, setContractAddress] = useState("");
  const [timeLength, setTimeLength] = useState("");
  const [fee, setFee] = useState("");
  const [untilWon, setUntilWon] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  async function handleAddEventType() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, Lotto);
      createLotto(contract, timeLength, fee, untilWon).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Create Lotto</h2>
      </div>
      <div className="row">
        <input
          type="string"
          value={contractAddress}
          placeholder="contractAddress (address)"
          onChange={(e) => setContractAddress(e.target.value)}
        />
      </div>
      <div className="row">
        <input
          type="number"
          value={timeLength}
          placeholder="timeLength (uint256)"
          onChange={(e) => setTimeLength(e.target.value)}
        />
      </div>
      <div className="row">
        <input
          type="number"
          value={fee}
          placeholder="fee (uint256)"
          onChange={(e) => setFee(e.target.value)}
        />
      </div>
      <div className="row">
        <input
          type="string"
          value={untilWon}
          placeholder="untilWon (bool)"
          onChange={(e) => setUntilWon(e.target.value)}
        />
      </div>
      <div className="row">
        <button onClick={handleAddEventType}>Add Event Types</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default CreateLotto;
