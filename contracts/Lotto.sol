// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

/**
 * @title Lotto
 * @notice Creates a lotto with a set of numbers and a prize
 * @dev numbers are set > 0 and <= 100
 */
contract Lotto is VRFConsumerBaseV2, AutomationCompatibleInterface {
    using Counters for Counters.Counter;
    VRFCoordinatorV2Interface COORDINATOR;
    Counters.Counter public lottoCounter;
    LottoInstance public lotto;
    RequestConfig public requestConfig;
    address public owner;
    address payable[] s_players;
    mapping(uint256 => address) private randomRequests;
    mapping(address => uint8[]) private s_tickets;
    mapping(uint256 => mapping(uint8 => bool)) winningMap;

    // ------------------- STRUCTS -------------------

    enum LottoState {
        STAGED,
        LIVE,
        FINISHED
    }

    struct LottoInstance {
        address[] contestantsAddresses;
        address[] winners;
        uint256 startDate;
        LottoState lottoState;
        uint256 prizeWorth;
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
    event LottoStaged(address[] participants);
    event RequestedLottoNumbers(uint256 indexed requestId);
    event WinningLotteryNumbers(uint8[] numbers);
    event LotteryWinners(address[] winners);

    // ------------------- ERRORS -------------------
    error LottoNotLive();

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

    /**
     * @notice creates new lottery
     * @param _timeLength length of the lottery
     * @param _fee fee to enter the lottery
     * @param _untilWon if the lottery will be finished when a winner is found
     **/
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
            lottoState: LottoState.LIVE,
            prizeWorth: 0,
            lottoOwner: msg.sender,
            timeLength: _timeLength,
            fee: _fee,
            untilWon: _untilWon
        });

        lotto = newLotto;
        emit LottoCreated(_timeLength, _fee);
    }

    /**
     * @notice withdraws rewards for an account
     * @param _numbers numbers chosen by the player
     * @dev empty array will trigger a random number generation
     **/
    function enterLotto(uint8[] memory _numbers) external payable {
        if (lotto.lottoState != LottoState.LIVE) {
            revert LottoNotLive();
        }
        require(
            msg.value >= lotto.fee,
            "You need to pay the fee to enter the lotto"
        );
        if (_numbers.length == 0) {
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
            require(_numbers.length == 6, "not enough numbers");
            for (uint256 i = 0; i < _numbers.length; i++) {
                require(_numbers[i] <= 100, "Number must be between 1 and 100");
            }
            s_players.push(payable(msg.sender));
            s_tickets[msg.sender] = _sortArray(_numbers);
        }
        lotto.prizeWorth += msg.value;
        lotto.contestantsAddresses.push(msg.sender);
        emit LottoEnter(msg.sender);
    }

    /**
     * @notice creates random numbers from VRF request
     * @dev if lotto state is live, it will create random numbers for the player
     * @dev if lotto state is staged, it will pick winners
     **/
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        uint256 randomNumber = randomWords[0];
        if (lotto.lottoState == LottoState.LIVE) {
            address a = randomRequests[requestId];
            s_tickets[a] = _sortArray(_createRandom(randomNumber, 6));
        } else {
            uint8[] memory winningNumbers = _createRandom(randomNumber, 6);
            emit WinningLotteryNumbers(winningNumbers);
            uint8[] memory sortedWinningNumbers = _sortArray(winningNumbers);
            for (uint256 i = 0; i < s_players.length; i++) {
                address payable player = s_players[i];
                uint8[] memory playerNumbers = s_tickets[player];
                for (uint8 j = 0; j < playerNumbers.length; j++) {
                    if (playerNumbers[j] != sortedWinningNumbers[j]) {
                        continue;
                    }
                    if (j == s_players.length) {
                        lotto.winners.push(player);
                    }
                }
            }
            if (lotto.winners.length > 0) {
                uint256 prize = lotto.prizeWorth / lotto.winners.length;
                for (uint256 i = 0; i < lotto.winners.length; i++) {
                    address payable winner = payable(lotto.winners[i]);
                    winner.transfer(prize);
                }
                lotto.lottoState = LottoState.FINISHED;
                emit LotteryWinners(lotto.winners);
            } else {
                lotto.lottoState = LottoState.LIVE;
                lotto.startDate = block.timestamp;
            }
        }
    }

    /**
     * @notice gets the winners of the lotto
     **/
    function getWinners() external view returns (address[] memory) {
        return lotto.winners;
    }

    /**
     * @notice withdraws rewards for an account
     * @param _randomValue random value generated by VRF
     * @param _n amount of numbers to generate
     **/
    function _createRandom(uint256 _randomValue, uint256 _n)
        internal
        pure
        returns (uint8[] memory expandedValues)
    {
        expandedValues = new uint8[](_n);
        for (uint256 i = 0; i < _n; i++) {
            uint256 v = uint256(keccak256(abi.encode(_randomValue, i)));
            expandedValues[i] = uint8(v % 100) + 1;
        }
        return expandedValues;
    }

    /**
     * @notice sorts array of numbers
     * @param _arr sorts list of numbers
     * @dev used to pick winner with less state changes
     **/
    function _sortArray(uint8[] memory _arr)
        internal
        pure
        returns (uint8[] memory)
    {
        for (uint256 i = 0; i < _arr.length; i++) {
            for (uint256 j = i + 1; j < _arr.length; j++) {
                if (_arr[i] > _arr[j]) {
                    uint8 temp = _arr[i];
                    _arr[i] = _arr[j];
                    _arr[j] = temp;
                }
            }
        }
        return _arr;
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
        if (lotto.lottoState != LottoState.LIVE) {
            upkeepNeeded = false;
        } else {
            upkeepNeeded =
                (block.timestamp - lotto.startDate) > lotto.timeLength;
        }
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        if (lotto.lottoState != LottoState.LIVE) {
            return;
        }
        if ((block.timestamp - lotto.startDate) > lotto.timeLength) {
            lotto.lottoState = LottoState.STAGED;
            address[] memory players = new address[](s_players.length);
            for (uint256 i = 0; i < s_players.length; i++) {
                players[i] = s_players[i];
            }
            emit LottoStaged(players);
            pickWinner();
        }
    }
}
