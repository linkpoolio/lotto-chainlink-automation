import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import Lotto from "sdk/src/abi/contracts/Lotto.sol/Lotto.json";
import { getWinners } from "sdk/src/ReadFunctions/getWinners";
import "../../styles/main.css";

function GetWinners() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  const [winners, setWinners] = useState("");

  async function handleGetWinners() {
    setWinners("");
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, Lotto);
      getWinners(contract)
        .then((res) => {
          setWinners(res.join(", "));
        })
        .catch((error: any) => {
          setErroMessage(error.message);
        });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Get Winners</h2>
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
        <button onClick={handleGetWinners}>Get Winners</button>
      </div>
      <div className="row">
        <p>Winners: {winners}</p>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default GetWinners;
