// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
pragma abicoder v2;

import {MpAsset} from "../lib/MpContext.sol";
import {FeedInfo, FeedType, UniV3Feed} from "../lib/Price.sol";
import {IEtfEvents} from "../interfaces/IEtfEvents.sol";
import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

contract ETF is IEtfEvents {

    ISwapRouter public immutable swapRouter;

   uint public totalTargetShares;

    mapping(address => MpAsset) internal assets;
    mapping(address => FeedInfo) internal priceFeeds;

    address owner;

    constructor(ISwapRouter _swapRouter) {
        owner = msg.sender;
        swapRouter = _swapRouter;
    }

        // Modifier to check that the caller is the owner of
    // the contract.
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        // Underscore is a special character only used inside
        // a function modifier and it tells Solidity to
        // execute the rest of the code.
        _;
    }
   
    function getAddress() public returns (address) {
        return address(this);
    }

    function getPriceFeed(address asset)
        external
        view
        returns (FeedInfo memory priceFeed)
    {
        priceFeed = priceFeeds[asset];
    }

    function getOracle(address asset) public view returns (address oracle) {
        oracle = priceFeeds[asset].univ3.oracle;
    }

    function getPrice(address asset) public view returns (uint price) {
        price = priceFeeds[asset].getPrice();
    }

    function getAsset(address assetAddress) public view returns (MpAsset memory asset) {
        asset = assets[assetAddress];
    }

    function updateTargetShares(
        address[] calldata assetAddresses,
        uint[] calldata targetShares
    )
        external
        onlyOwner
    {
        uint len = assetAddresses.length;
        uint totalTargetSharesCached = totalTargetShares;
        for (uint a; a < len; ++a) {
            address assetAddress = assetAddresses[a];
            uint targetShare = targetShares[a];
            MpAsset memory asset = assets[assetAddress];
            totalTargetSharesCached = totalTargetSharesCached - asset.targetShare + targetShare;
            asset.targetShare = uint128(targetShare);
            assets[assetAddress] = asset;
            emit TargetShareChange(assetAddress, targetShare, totalTargetSharesCached);
        }
        totalTargetShares = totalTargetSharesCached;
    }

    function updatePrices(
        address[] calldata assetAddresses,
        FeedType[] calldata kinds,
        bytes[] calldata feedData,
        UniV3Feed[] calldata uniV3Feed
    )
        external
        onlyOwner
    {
        uint len = assetAddresses.length;
        for (uint i; i < len; ++i) {
            address assetAddress = assetAddresses[i];
            FeedInfo memory feed = FeedInfo({kind: kinds[i], data: feedData[i], univ3 : uniV3Feed[i]});
            priceFeeds[assetAddress] = feed;
            emit PriceFeedChange(assetAddress, feed);
        }
    }

    struct Args {
        address tokenIn;
        address tokenOut;
        uint amountIn;
        uint amountOutMinimum;
        uint24 poolFee; //3000
    }

    /*
    //https://docs.uniswap.org/contracts/v3/guides/swaps/single-swaps
    //https://github.com/arcanum-protocol/arcanum-contracts/blob/master/src/trader/Trader.sol
    /// @notice swapExactInputSingle swaps a fixed amount of DAI for a maximum possible amount of WETH9
    /// using the DAI/WETH9 0.3% pool by calling `exactInputSingle` in the swap router.
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its DAI for this function to succeed.
    /// @param amountIn The exact amount of DAI that will be swapped for WETH9.
    /// @return amountOut The amount of WETH9 received.
    */
    function uniswapV3ExactInputSingle(Args calldata args) internal returns (uint amountOut) {
        //TransferHelper.safeApprove(address(args.tokenIn), address(swapRouter), args.amountIn);

        // Transfer the specified amount of WETH9 to this contract.
        //TransferHelper.safeTransferFrom(args.tokenIn, msg.sender, address(this), args.amountIn);

		// Approve the router to spend WETH9.
        TransferHelper.safeApprove(args.tokenIn, address(swapRouter), args.amountIn);

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: args.tokenIn, //WETH 
                tokenOut: args.tokenOut, //DAI
                fee: args.poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: args.amountIn,
                amountOutMinimum: args.amountOutMinimum,
                sqrtPriceLimitX96: 0
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);

        emit SwapChange(params.tokenIn, params.tokenOut, args.amountIn, amountOut);
    }

    function rebalance(Args[] calldata args) external onlyOwner {
         uint len = args.length;
         for (uint i; i < len; ++i) {
            uniswapV3ExactInputSingle(args[i]);
        }
    }
}