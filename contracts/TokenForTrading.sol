//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

string constant NAME = "TokenForTrading";
string constant SYMBOL = "TFT";

contract TokenForTrading is ERC20 {
    address public tradingPlatform;
    address public owner;

    constructor() ERC20(NAME, SYMBOL) {
        owner = msg.sender;
    }

    modifier onlyTradingPlatform() {
        require(
            msg.sender == tradingPlatform || msg.sender == owner,
            "Only trading platform"
        );
        _;
    }

    function mint(address _account, uint256 _amount)
        external
        onlyTradingPlatform
    {
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _amount)
        external
        onlyTradingPlatform
    {
        _burn(_account, _amount);
    }

    function changeTradingPlatform(address _tradingPlatform)
        external
        onlyTradingPlatform
    {
        tradingPlatform = _tradingPlatform;
    }
}
