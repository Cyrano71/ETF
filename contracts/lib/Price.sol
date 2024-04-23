// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

import {IEtfErrors} from "../interfaces/IEtfErrors.sol";

enum FeedType {
    // Unset value
    Undefined,
    // Constant value used for tests and to represend quote price feed to quote
    FixedValue,
    // Uniswap v3 price extraction
    UniV3,
    // Call for other contract to provide price
    Adapter
}


struct FeedInfo {
    FeedType kind;
    bytes data;
}

using {PriceMath.getPrice} for FeedInfo global;

library PriceMath {
    /// @notice Extracts current price from origin
    /// @dev Processed the provided `prceFeed` to get it's current price value.
    /// @param priceFeed struct with data of supplied price feed
    /// @return price value is represented as a Q96 value
    function getPrice(FeedInfo memory priceFeed) internal view returns (uint price) {
        if (priceFeed.kind == FeedType.FixedValue) {
            price = abi.decode(priceFeed.data, (uint));
        } else {
            revert IEtfErrors.NoPriceOriginSet();
        }
    }
}