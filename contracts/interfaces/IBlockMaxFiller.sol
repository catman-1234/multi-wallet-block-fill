// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBlockMaxFiller {
    function clearStorage() external;
    function fillBlock() external;
}
