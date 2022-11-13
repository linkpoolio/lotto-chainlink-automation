// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// import "hardhat/console.sol";

contract Lotto is VRFConsumerBaseV2, AutomationCompatibleInterface {
    using Counters for Counters.Counter;
    VRFCoordinatorV2Interface COORDINATOR;
    address public owner;
    Counters.Counter public lottoCounter;
    mapping(uint256 => LottoInstance) public lottos;
    mapping(uint256 => address) private randomRequests;
    mapping(uint256 => Participant[]) private contestants;
    bool public lottoLive;
    RequestConfig public requestConfig;

    // ------------------- STRUCTS -------------------

    struct LottoInstance {
        address[] contestantsAddresses;
        uint256[] winners;
        uint256 startDate;
        bool lottoDone;
        uint256 prizeWorth;
        uint256 randomSeed;
        bool lottoStaged;
        string provenanceHash;
        address lottoOwner;
        uint256 timeLength;
        uint256 fee;
        bool untilWon;
    }

    struct Participant {
        Ticket[] tickets;
    }

    struct Ticket {
        uint256[] numbers;
        uint256 requestId;
    }

    struct RequestConfig {
        uint64 subscriptionId;
        uint32 callbackGasLimit;
        uint16 requestConfirmations;
        uint32 numWords;
        bytes32 keyHash;
    }

    //------------------------------ EVENTS ----------------------------------

    event LottoCreated(uint256 indexed time, uint256 indexed fee);
    event EnteredLotto(uint256 indexed lottoId, address indexed player);
    event LottoClosed(uint256 indexed lottoId, address[] participants);

    // ------------------- MODIFIERS -------------------

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        uint16 _requestConfirmations,
        uint32 _callbackGasLimit,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        owner = msg.sender;
        requestConfig = RequestConfig({
            subscriptionId: _subscriptionId,
            callbackGasLimit: _callbackGasLimit,
            requestConfirmations: _requestConfirmations,
            numWords: 1,
            keyHash: _keyHash
        });
    }

    function createLotto(
        uint256 _timeLength,
        uint256 _fee,
        bool _untilWon
    ) external onlyOwner {
        lottoCounter.increment();

        LottoInstance memory newLotto = LottoInstance({
            contestantsAddresses: new address[](0),
            winners: new uint256[](0),
            startDate: block.timestamp,
            lottoDone: false,
            prizeWorth: 0,
            randomSeed: 0,
            lottoStaged: false,
            provenanceHash: "",
            lottoOwner: msg.sender,
            timeLength: _timeLength,
            fee: _fee,
            untilWon: _untilWon
        });

        lottos[lottoCounter.current()] = newLotto;
        lottoLive = true;
        emit LottoCreated(_timeLength, _fee);
    }

    function enterLotto(Ticket memory _ticket, bool _randomPick)
        external
        payable
    {
        require(lottoLive == true, "Lotto is not live");
        require(
            msg.value >= lottos[lottoCounter.current()].fee,
            "You need to pay the fee to enter the lotto"
        );
        if (_randomPick) {
            uint256 requestId = COORDINATOR.requestRandomWords(
                requestConfig.keyHash,
                requestConfig.subscriptionId,
                requestConfig.requestConfirmations,
                requestConfig.callbackGasLimit,
                1
            );
            randomRequests[requestId] = msg.sender;
            // contestants[lottoCounter.current()].push(
            //     Participant({tickets: new Ticket[](0)}) // NOT COMPILING
            // );
            // lottos[lottoCounter.current()].contestants[
            //     msg.sender
            // ] = Participant({tickets: new Ticket[](0)});
            // lottos[lottoCounter.current()].contestants[msg.sender].tickets.push(
            //         Ticket({numbers: new uint256[](0), requestId: requestId})
            //     );
        }

        lottos[lottoCounter.current()].prizeWorth += msg.value;
        emit EnteredLotto(lottoCounter.current(), msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        if (randomWords.length > 1) {
            uint256 randomSeed = randomWords[0];
            lottos[lottoCounter.current()].lottoStaged = true;
        } else {
            uint256 randomNumber = randomWords[0];
            address a = randomRequests[requestId];
            // lottos[lottoCounter.current()]
            //     .contestants[a]
            //     .tickets[0]
            //     .numbers
            //     .push(randomNumber);
        }
        // uint256 randomSeed = randomWords[0];
        // uint256 raffleIndexFromRequestId = requestIdToRaffleIndex[requestId];
        // raffles[raffleIndexFromRequestId].randomSeed = randomWords[0];

        // stagedLotto.push(raffleIndexFromRequestId);
    }

    function createRange(uint256 _max)
        internal
        pure
        returns (uint256[] memory)
    {
        uint256[] memory range = new uint256[](_max);
        for (uint256 i = 0; i < _max; i++) {
            range[i] = i;
        }
        return range;
    }

    function pickWinner() internal {}

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        if (!lottoLive) {
            upkeepNeeded = false;
        } else {
            upkeepNeeded =
                (block.timestamp - lottos[lottoCounter.current()].startDate) >
                lottos[lottoCounter.current()].timeLength;
        }
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        if (!lottoLive) {
            return;
        }
        if (
            (block.timestamp - lottos[lottoCounter.current()].startDate) >
            lottos[lottoCounter.current()].timeLength
        ) {
            lottoLive = false;
            emit LottoClosed(
                lottoCounter.current(),
                lottos[lottoCounter.current()].contestantsAddresses
            );
            pickWinner();
        }
    }
}
