import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { DAI_TOKEN, WETH_TOKEN } from './constants'

// Inputs that configure this example to run
export interface ExampleConfig {
  rpc: {
    local: string
    mainnet: string
  },
  tokens: {
    in: Token
    amountIn: number
    out: Token
    poolFee: number
  }
}

// Example Configuration
export const CurrentConfig: ExampleConfig = {
  rpc: {
    local: 'http://127.0.0.1:8545/',
    mainnet: '',
  },
  tokens: {
    in: DAI_TOKEN,
    amountIn: 1000,
    out: WETH_TOKEN,
    poolFee: FeeAmount.MEDIUM,
  },
}