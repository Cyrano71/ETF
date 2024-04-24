import { ethers } from 'ethers'
import { CurrentConfig } from './config'

// Provider Functions

export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(CurrentConfig.rpc.local)
}