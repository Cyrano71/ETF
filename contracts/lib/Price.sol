// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

import {IEtfErrors} from "../interfaces/IEtfErrors.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

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
    UniV3Feed univ3;
}

// Data of uniswap v3 feed
struct UniV3Feed {
    // Pool address
    address oracle;
    // Shows wether to flip the price
    bool reversed;
    // Interval of aggregation in seconds
    uint twapInterval;
}

using {PriceMath.getPrice, PriceMath.getDecodedData} for FeedInfo global;

library PriceMath {
    function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
        if (a == 0) {
        return 0;
        }
        c = a * b;
        assert(c / a == b);
        return c;
    }

    function getDecodedData(FeedInfo memory priceFeed) internal pure returns (address oracle) {
        UniV3Feed memory data = abi.decode(priceFeed.data, (UniV3Feed));
        oracle = data.oracle;
    }

    /// @notice Extracts current price from origin
    /// @dev Processed the provided `prceFeed` to get it's current price value.
    /// @param priceFeed struct with data of supplied price feed
    /// @return price value is represented as a Q96 value
    function getPrice(FeedInfo memory priceFeed) internal view returns (uint price) {
        if (priceFeed.kind == FeedType.FixedValue) {
            price = abi.decode(priceFeed.data, (uint));
        } else if (priceFeed.kind == FeedType.UniV3) {
            //UniV3Feed memory data = abi.decode(priceFeed.data, (UniV3Feed));
            //https://ethereum.stackexchange.com/questions/98685/computing-the-uniswap-v3-pair-price-from-q64-96-number
            (uint160 sqrtPriceX96,,,,,,) =  IUniswapV3Pool(priceFeed.univ3.oracle).slot0();
            price = mul(mul(uint(sqrtPriceX96),uint(sqrtPriceX96)),1e18) >> (96 * 2);
        } else {
            revert IEtfErrors.NoPriceOriginSet();
        }
    }
}