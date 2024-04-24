import { ethers as ethers2} from 'ethers'

const READABLE_FORM_LEN = 4

export function fromReadableAmount(
  amount: number,
  decimals: number
): BigInt {
  return ethers2.parseUnits(amount.toString(), decimals)
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return ethers2
    .formatUnits(rawAmount, decimals)
    .slice(0, READABLE_FORM_LEN)
}