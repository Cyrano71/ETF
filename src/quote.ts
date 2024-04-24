//https://github.com/Uniswap/examples/blob/main/v3-sdk/quoting/src/libs/constants.ts
//https://docs.uniswap.org/sdk/v3/guides/swaps/quoting

import { CurrentConfig } from './config'
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
} from './constants'
import { toReadableAmount, fromReadableAmount } from './conversion'
import { ethers } from 'ethers'
import { Token } from '@uniswap/sdk-core'
import { computePoolAddress } from '@uniswap/v3-sdk'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { FeeAmount } from '@uniswap/v3-sdk'

async function quote() {
      const signer = new ethers.Wallet(
          "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
          new ethers.JsonRpcProvider('http://127.0.0.1:8545/')
      );

      const quoterContract = new ethers.Contract(
        QUOTER_CONTRACT_ADDRESS,
        Quoter.abi,
        signer
      );

      const poolConstants = await getPoolConstants(CurrentConfig.tokens.in, CurrentConfig.tokens.out, FeeAmount.MEDIUM, signer);
      console.log(poolConstants);

      const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall(
        poolConstants.token0,
        poolConstants.token1,
        poolConstants.fee,
        fromReadableAmount(
          1000,
          CurrentConfig.tokens.in.decimals
        ).toString(),
        0
      )

      const amount = toReadableAmount(quotedAmountOut, CurrentConfig.tokens.out.decimals)
      console.log(amount);
}

async function getPoolConstants(tokenIn: Token, tokenOut: Token, poolFee: number, signer: ethers.Wallet) {
    const currentPoolAddress = computePoolAddress({
      factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
      tokenA: tokenIn,
      tokenB: tokenOut,
      fee: poolFee,
    })
  
    const poolContract = new ethers.Contract(
      currentPoolAddress,
      IUniswapV3PoolABI.abi,
      signer
    )

    const [token0, token1, fee, liquidity, slot0] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ])
  
    return {
      token0,
      token1,
      fee,
      liquidity,
      slot0
    }
  }
  
quote().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

