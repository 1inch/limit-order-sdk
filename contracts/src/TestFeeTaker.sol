pragma solidity ^0.8.23;

import "../lib/limit-order-protocol/contracts/extensions/FeeTaker.sol";

contract TestFeeTaker is FeeTaker
{
    // solhint-disable-next-line no-empty-blocks
    constructor(address limitOrderProtocol, IERC20 accessToken, address weth, address owner) FeeTaker(limitOrderProtocol, accessToken, weth, owner) {}
}
