//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interface/ITokenForTrading.sol";

error AlreadyRegistered();
error IncorrectAddress();
error IncorrectAmount();
error RoundNotProgress();
error RoundInProgress();
error RoundNotSale();
error RoundNotTrade();
error NoSupply();
error NotEnoughFunds();

contract TradingPlatform is ReentrancyGuard {
    enum Status {
        NONE,
        PROGRESS,
        FINISHED
    }

    enum Type {
        NONE,
        SALE,
        TRADE
    }

    struct Round {
        Status status;
        Type roundType;
        uint256 startTime;
        uint256 endTime;
        uint256 supply;
        uint256 ethAmount;
        uint256 tokenPrice;
        Order[] orders;
    }

    struct User {
        bool registered;
        address[] refers;
    }

    struct Order {
        Status status;
        uint256 amount;
        uint256 price;
        address owner;
    }

    address public token;
    uint32 public constant ROUND_DURATION = 3 days;
    uint32 public constant FIRST_REFERRAL_PERCENTAGE = 5;
    uint32 public constant SECOND_REFERRAL_PERCENTAGE = 3;
    uint256 public roundId;

    mapping(address => User) private users;
    mapping(uint256 => Round) private rounds;

    constructor(address _token, uint256 _supply) {
        token = _token;
        ITokenForTrading(token).mint(address(this), _supply);
        roundId++;
        Round storage round = rounds[roundId];
        round.status = Status.PROGRESS;
        round.roundType = Type.SALE;
        round.startTime = block.timestamp;
        round.endTime = round.startTime + ROUND_DURATION;
        round.supply = _supply;
        round.tokenPrice = _tokenPrice(_supply);
    }

    modifier onlyRegistered() {
        require(users[msg.sender].registered, "Only registered");
        _;
    }

    function registation(address _refer) external {
        if (_refer == address(0x0)) revert IncorrectAddress();
        if (msg.sender == _refer) revert IncorrectAddress();
        User storage user = users[msg.sender];
        if (user.registered) revert AlreadyRegistered();
        user.registered = true;
        User memory refer = users[_refer];
        if (refer.registered) user.refers.push(_refer);
        if (refer.refers.length > 0) user.refers.push(refer.refers[0]);
    }

    function registation() external {
        User storage user = users[msg.sender];
        if (user.registered) revert AlreadyRegistered();
        user.registered = true;
    }

    function buyTokens() external payable nonReentrant onlyRegistered {
        Round storage round = rounds[roundId];
        User memory user = users[msg.sender];
        uint256 tokenAmount = msg.value * round.tokenPrice;
        if (round.status != Status.PROGRESS && block.timestamp > round.endTime)
            revert RoundNotProgress();
        if (round.roundType != Type.SALE) revert RoundNotSale();
        if (round.supply < tokenAmount) revert NoSupply();
        if (round.supply == 0) {
            nextRound();
        } else {
            if (user.refers.length > 0) {
                if (user.refers.length == 1)
                    _withdrawEth(
                        user.refers[0],
                        (msg.value * FIRST_REFERRAL_PERCENTAGE) / 100
                    );
                if (user.refers.length == 2)
                    _withdrawEth(
                        user.refers[1],
                        (msg.value * SECOND_REFERRAL_PERCENTAGE) / 100
                    );
            }
            round.supply -= tokenAmount;
            round.ethAmount += msg.value;
            ITokenForTrading(token).transfer(msg.sender, tokenAmount);
        }
    }

    function creareOrder(uint256 _amount, uint256 _price)
        external
        onlyRegistered
    {
        Round storage round = rounds[roundId];
        uint256 balance = ITokenForTrading(token).balanceOf(msg.sender);
        if (round.status != Status.PROGRESS && block.timestamp > round.endTime)
            revert RoundNotProgress();
        if (round.roundType != Type.TRADE) revert RoundNotTrade();
        if (_amount > balance) revert NotEnoughFunds();
        ITokenForTrading(token).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        round.orders.push(
            Order({
                status: Status.PROGRESS,
                amount: _amount,
                price: _price,
                owner: msg.sender
            })
        );
    }

    function buyOrder(uint256 _orderId)
        external
        payable
        nonReentrant
        onlyRegistered
    {
        Round storage round = rounds[roundId];
        User memory user = users[msg.sender];
        uint256 tokenBuy = (msg.value * round.orders[_orderId].price) / 100;
        uint256 tokenAmount = (tokenBuy * round.orders[_orderId].amount) / 100;
        if (round.status != Status.PROGRESS && block.timestamp > round.endTime)
            revert RoundNotProgress();
        if (round.roundType != Type.TRADE) revert RoundNotTrade();
        if (tokenAmount > round.orders[_orderId].amount)
            revert IncorrectAmount();
        if (user.refers.length > 0) {
            if (user.refers.length == 1)
                _withdrawEth(
                    user.refers[0],
                    (msg.value * FIRST_REFERRAL_PERCENTAGE) / 100
                );
            if (user.refers.length == 2)
                _withdrawEth(
                    user.refers[1],
                    (msg.value * SECOND_REFERRAL_PERCENTAGE) / 100
                );
        }
        round.ethAmount += msg.value;
        round.orders[_orderId].amount -= tokenAmount;
        round.orders[_orderId].price -= tokenBuy;
        ITokenForTrading(token).transfer(msg.sender, tokenAmount);
        _withdrawEth(round.orders[_orderId].owner, msg.value);
    }

    function finishOrder(uint256 _orderId) external onlyRegistered {
        Round storage round = rounds[roundId];
        if (round.status != Status.PROGRESS && block.timestamp > round.endTime)
            revert RoundNotProgress();
        if (
            msg.sender != address(this) ||
            msg.sender != round.orders[_orderId].owner
        ) revert IncorrectAddress();
        round.status = Status.FINISHED;
        if (round.orders[_orderId].amount > 0)
            ITokenForTrading(token).transfer(
                round.orders[_orderId].owner,
                round.orders[_orderId].amount
            );
    }

    function nextRound() public onlyRegistered {
        Round storage round = rounds[roundId];
        if (round.status == Status.PROGRESS && block.timestamp < round.endTime)
            revert RoundInProgress();
        _finishRound(round);
        roundId++;
        if (round.roundType == Type.SALE) {
            _tradeRound();
        } else {
            _saleRound(round.tokenPrice, round.ethAmount);
        }
    }

    function _saleRound(uint256 tokenPrice, uint256 ethAmount) private {
        Round storage round = rounds[roundId];
        round.status = Status.PROGRESS;
        round.roundType = Type.SALE;
        round.startTime = block.timestamp;
        round.endTime = round.startTime + ROUND_DURATION;
        round.supply = ethAmount / tokenPrice;
        round.tokenPrice = _tokenPrice(tokenPrice);
    }

    function _tradeRound() private {
        Round storage round = rounds[roundId];
        round.status = Status.PROGRESS;
        round.roundType = Type.TRADE;
        round.startTime = block.timestamp;
        round.endTime = round.startTime + ROUND_DURATION;
    }

    function _finishRound(Round storage round) private {
        round.status = Status.FINISHED;
        for (uint256 i; i <= round.orders.length; i++) {
            if (round.orders[i].status != Status.FINISHED) {
                round.orders[i].status = Status.FINISHED;
                ITokenForTrading(token).transfer(
                    round.orders[i].owner,
                    round.orders[i].amount
                );
            }
        }
        if (round.supply > 0)
            ITokenForTrading(token).burn(address(this), round.supply);
    }

    function _tokenPrice(uint256 _lastPrice) private pure returns (uint256) {
        return (_lastPrice / 1000) * 103 + 4e3;
    }

    function _withdrawEth(address _to, uint256 _amount) private {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Ethereum sending error");
    }
}
