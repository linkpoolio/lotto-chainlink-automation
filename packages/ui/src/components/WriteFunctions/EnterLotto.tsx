import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import Lotto from "sdk/src/abi/contracts/Lotto.sol/Lotto.json";
import { enterLotto } from "sdk/src/WriteFunctions/enterLotto";

function EnterLotto() {
  const [contractAddress, setContractAddress] = useState("");
  const [numbers, setNumbers] = useState("");
  const [fee, setFee] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleEnterLotto() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, Lotto);
      enterLotto(contract, numbers, fee).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Enter Lotto</h2>
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
          type="string"
          value={numbers}
          placeholder="numbers (uint8[])"
          onChange={(e) => setNumbers(e.target.value)}
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
        <button onClick={handleEnterLotto}>Enter Lotto</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default EnterLotto;
