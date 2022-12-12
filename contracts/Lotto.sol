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
    LottoInstance public lotto;
    mapping(uint256 => address) private randomRequests;
    mapping(uint256 => Participant[]) private contestants;
    bool public lottoLive;
    RequestConfig public requestConfig;
    address payable[] s_players;
    mapping(address => uint8[]) private s_tickets;
    mapping(uint256 => mapping(uint8 => bool)) winningMap;

    // ------------------- STRUCTS -------------------

    struct LottoInstance {
        address[] contestantsAddresses;
        address[] winners;
        uint256 startDate;
        bool lottoDone;
        uint256 prizeWorth;
        uint256 randomSeed;
        bool lottoStaged;
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
    event LottoEnter(address indexed player);
    event LottoClosed(address[] participants);
    event RequestedLottoNumbers(uint256 indexed requestId);
    event WinningLotteryNumbers(uint8[] numbers);
    event LotteryWinners(address[] winners);

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
            winners: new address[](0),
            startDate: block.timestamp,
            lottoDone: false,
            prizeWorth: 0,
            randomSeed: 0,
            lottoStaged: false,
            lottoOwner: msg.sender,
            timeLength: _timeLength,
            fee: _fee,
            untilWon: _untilWon
        });

        lotto = newLotto;
        lottoLive = true;
        emit LottoCreated(_timeLength, _fee);
    }

    function enterLotto(uint8[] memory numbers) external payable {
        require(lottoLive, "Lotto is not live");
        require(
            msg.value >= lotto.fee,
            "You need to pay the fee to enter the lotto"
        );
        if (numbers.length == 0) {
            uint256 requestId = COORDINATOR.requestRandomWords(
                requestConfig.keyHash,
                requestConfig.subscriptionId,
                requestConfig.requestConfirmations,
                requestConfig.callbackGasLimit,
                1
            );
            randomRequests[requestId] = msg.sender;
            s_players.push(payable(msg.sender));
        } else {
            require(numbers.length == 6, "not enough numbers");
            for (uint256 i = 0; i < numbers.length; i++) {
                require(numbers[i] <= 100, "Number must be between 1 and 100");
            }
            s_players.push(payable(msg.sender));
            s_tickets[msg.sender] = numbers;
        }
        lotto.prizeWorth += msg.value;
        emit LottoEnter(msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        uint256 randomNumber = randomWords[0];
        if (lottoLive) {
            address a = randomRequests[requestId];
            s_tickets[a] = createRandom(randomNumber, 6);
        } else {
            uint8[] memory winningNumbers = createRandom(randomNumber, 6);
            for (uint256 i = 0; i < winningNumbers.length; i++) {
                winningMap[lottoCounter.current()][winningNumbers[i]] = true;
            }
            emit WinningLotteryNumbers(winningNumbers);
            for (uint256 i = 0; i < s_players.length; i++) {
                address payable player = s_players[i];
                uint8[] memory playerNumbers = s_tickets[player];
                for (uint8 j = 0; j < playerNumbers.length; j++) {
                    if (!winningMap[lottoCounter.current()][playerNumbers[j]]) {
                        continue;
                    }
                    lotto.winners.push(player);
                }
            }
            if (lotto.winners.length > 0) {
                uint256 prize = lotto.prizeWorth / lotto.winners.length;
                for (uint256 i = 0; i < lotto.winners.length; i++) {
                    address payable winner = payable(lotto.winners[i]);
                    winner.transfer(prize);
                }
                emit LotteryWinners(lotto.winners);
            }
        }
    }

    function createRandom(uint256 randomValue, uint256 n)
        public
        pure
        returns (uint8[] memory expandedValues)
    {
        expandedValues = new uint8[](n);
        for (uint256 i = 0; i < n; i++) {
            uint256 v = uint256(keccak256(abi.encode(randomValue, i)));
            expandedValues[i] = uint8(v % 100) + 1;
        }
        return expandedValues;
    }

    function pickWinner() internal {
        uint256 requestId = COORDINATOR.requestRandomWords(
            requestConfig.keyHash,
            requestConfig.subscriptionId,
            requestConfig.requestConfirmations,
            requestConfig.callbackGasLimit,
            1
        );
        emit RequestedLottoNumbers(requestId);
    }

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
                (block.timestamp - lotto.startDate) > lotto.timeLength;
        }
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        if (!lottoLive) {
            return;
        }
        if ((block.timestamp - lotto.startDate) > lotto.timeLength) {
            lottoLive = false;
            address[] memory players = new address[](s_players.length);
            for (uint256 i = 0; i < s_players.length; i++) {
                players[i] = s_players[i];
            }
            emit LottoClosed(players);
            pickWinner();
        }
    }
}
