//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

string constant NAME = "TokenForTrading";
string constant SYMBOL = "TFT";

contract TokenForTrading is ERC20, Ownable {
    address public tradingPlatform;

    constructor() ERC20(NAME, SYMBOL) {}

    modifier onlyTradingPlatform() {
        require(msg.sender == tradingPlatform, "Only trading platform");
        _;
    }

    function mint(address _account, uint _amount) external onlyTradingPlatform {
        _mint(_account, _amount);
    }

    function burn(address _account, uint _amount) external onlyTradingPlatform {
        _burn(_account, _amount);
    }

    function changeTradingPlatform(address _tradingPlatform) external onlyOwner {
        tradingPlatform = _tradingPlatform;
    }
}
