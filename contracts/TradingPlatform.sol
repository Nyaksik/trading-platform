//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interface/ITokenForTrading.sol";
import "hardhat/console.sol";

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
    uint256 public roundId = 1;

    mapping(address => User) private users;
    mapping(uint256 => Round) private rounds;

    constructor(address _token, uint256 _supply) {
        token = _token;
        Round storage round = rounds[roundId];
        round.status = Status.PROGRESS;
        round.roundType = Type.SALE;
        round.startTime = block.timestamp;
        round.endTime = round.startTime + ROUND_DURATION;
        round.supply = _supply;
        round.tokenPrice = 1e4;
    }

    modifier onlyRegistered() {
        require(users[msg.sender].registered, "Only registered");
        _;
    }

    function getRound(uint256 _roundId) external view returns (Round memory) {
        return rounds[_roundId];
    }

    function getUser(address _user) external view returns (User memory) {
        return users[_user];
    }

    function registation(address _refer) external {
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
        if (round.status != Status.PROGRESS || block.timestamp > round.endTime)
            revert RoundNotProgress();
        if (round.roundType != Type.SALE) revert RoundNotSale();
        User memory user = users[msg.sender];
        uint256 tokenAmount = msg.value / round.tokenPrice;
        if (round.supply < tokenAmount) revert NoSupply();
        if (user.refers.length > 0)
            _withdrawEth(
                user.refers[0],
                (msg.value * FIRST_REFERRAL_PERCENTAGE) / 100
            );
        if (user.refers.length == 2)
            _withdrawEth(
                user.refers[1],
                (msg.value * SECOND_REFERRAL_PERCENTAGE) / 100
            );
        round.supply -= tokenAmount;
        round.ethAmount += msg.value;
        ITokenForTrading(token).transfer(msg.sender, tokenAmount);
        if (round.supply == 0) nextRound();
    }

    function createOrder(uint256 _amount, uint256 _price)
        external
        onlyRegistered
    {
        Round storage round = rounds[roundId];
        uint256 balance = ITokenForTrading(token).balanceOf(msg.sender);
        if (round.status != Status.PROGRESS || block.timestamp > round.endTime)
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
        if (round.status != Status.PROGRESS || block.timestamp > round.endTime)
            revert RoundNotProgress();
        if (round.roundType != Type.TRADE) revert RoundNotTrade();
        uint256 tokenBuy = (msg.value * 100) / round.orders[_orderId].price;
        uint256 tokenAmount = (tokenBuy * round.orders[_orderId].amount) / 100;
        if (msg.value > round.orders[_orderId].price) revert IncorrectAmount();
        if (user.refers.length > 0)
            _withdrawEth(
                user.refers[0],
                (msg.value * FIRST_REFERRAL_PERCENTAGE) / 100
            );
        if (user.refers.length == 2)
            _withdrawEth(
                user.refers[1],
                (msg.value * SECOND_REFERRAL_PERCENTAGE) / 100
            );
        round.ethAmount += msg.value;
        round.orders[_orderId].amount -= tokenAmount;
        round.orders[_orderId].price -= msg.value;
        ITokenForTrading(token).transfer(msg.sender, tokenAmount);
        _withdrawEth(round.orders[_orderId].owner, msg.value);
    }

    function finishOrder(uint256 _orderId) external onlyRegistered {
        Round storage round = rounds[roundId];
        if (msg.sender != round.orders[_orderId].owner)
            revert IncorrectAddress();
        round.orders[_orderId].status = Status.FINISHED;
        if (round.orders[_orderId].amount > 0)
            ITokenForTrading(token).transfer(
                round.orders[_orderId].owner,
                round.orders[_orderId].amount
            );
    }

    function nextRound() public onlyRegistered {
        Round storage round = rounds[roundId];
        require(
            block.timestamp >= round.endTime ||
                (round.roundType == Type.SALE && round.supply == 0),
            "Round is not finished"
        );
        _finishRound(round);
        roundId++;
        if (round.roundType == Type.SALE) {
            _tradeRound(round.tokenPrice);
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
        round.supply = ethAmount * tokenPrice;
        round.tokenPrice = _tokenPrice(tokenPrice);
        ITokenForTrading(token).mint(address(this), round.supply);
    }

    function _tradeRound(uint256 tokenPrice) private {
        Round storage round = rounds[roundId];
        round.status = Status.PROGRESS;
        round.roundType = Type.TRADE;
        round.startTime = block.timestamp;
        round.endTime = round.startTime + ROUND_DURATION;
        round.tokenPrice = _tokenPrice(tokenPrice);
    }

    function _finishRound(Round storage round) private {
        round.status = Status.FINISHED;
        for (uint256 i; i < round.orders.length; i++) {
            round.orders[i].status = Status.FINISHED;
            ITokenForTrading(token).transfer(
                round.orders[i].owner,
                round.orders[i].amount
            );
        }
        if (round.supply > 0)
            ITokenForTrading(token).burn(address(this), round.supply);
    }

    function _tokenPrice(uint256 _lastPrice) private pure returns (uint256) {
        return (_lastPrice / 1e2) * 103 + 4e3;
    }

    function _withdrawEth(address _to, uint256 _amount) private {
        _to.call{value: _amount}("");
    }
}
