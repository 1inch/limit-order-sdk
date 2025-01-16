pragma solidity ^0.8.23;

import "../lib/limit-order-protocol/contracts/LimitOrderProtocol.sol";

contract TestLimitOrderProtocol is LimitOrderProtocol {
    constructor(IWETH weth) LimitOrderProtocol(weth) {}
}
