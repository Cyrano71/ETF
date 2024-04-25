//https://blog.uniswap.org/your-first-uniswap-integration
//https://github.com/Uniswap/uniswap-first-contract-example/blob/simple-swap-complete-example/test/SimpleSwap.test.js

const { ethers } = require("hardhat");

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const DAI_DECIMALS = 18; 
const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; 
const POOL_ADDRESS = "0xC2e9F25Be6257c210d7Adf0D4Cd6E3E881ba25f8"

const ercAbi = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  // Authenticated Functions
  "function transfer(address to, uint amount) returns (bool)",
  "function deposit() public payable",
  "function approve(address spender, uint256 amount) returns (bool)",
];

describe("ETF", function () {
  it("update etf assets prices", async function () {
    const simpleSwapFactory = await ethers.getContractFactory("ETF");
    //const simpleSwap = await simpleSwapFactory.deploy(SWAP_ROUTER_ADDRESS);
    const simpleSwap = simpleSwapFactory.attach(
      "0xfcca971fe9ee20c1cf22596e700aa993d8fd19c5"
    );
    await simpleSwap.waitForDeployment();
    //const feedData = ethers.solidityPacked(["address", "bool", "uint"], [POOL_ADDRESS, false, 0])
    //console.log("Feed Data : ", feedData);

    simpleSwap.on("PriceFeedChange", (arg1, arg2, event)=> {
      console.log("Event is", event.filter, arg1, arg2);
    });
    const tx = await simpleSwap.updatePrices([DAI_ADDRESS], [2], ["0x"], [{oracle: POOL_ADDRESS, reversed: false, twapInterval: 0}])
    await tx.wait();
    await new Promise(res => setTimeout(() => res(null), 5000));
    console.log("Oracle : ", await simpleSwap.getOracle(DAI_ADDRESS))

    const uniswapPrice = await simpleSwap.getPrice(DAI_ADDRESS)
    console.log(uniswapPrice)
  });
 
  it("rebalance etf with uniswap v3", async function () {
    const simpleSwapFactory = await ethers.getContractFactory("ETF");
    //const simpleSwap = await simpleSwapFactory.deploy(SWAP_ROUTER_ADDRESS);
    const simpleSwap = simpleSwapFactory.attach(
      "0x6c383Ef7C9Bf496b5c847530eb9c49a3ED6E4C56"
    );
    await simpleSwap.waitForDeployment();
    const simpleSwapAddress = await simpleSwap.getAddress();
    console.log("address of the sc : ", simpleSwapAddress)

    let signers = await ethers.getSigners();
    //console.log(signers)
    const signer = signers[0]

    //Connect to WETH and wrap some eth
    const WETH = new ethers.Contract(WETH_ADDRESS, ercAbi, signer);
    const deposit = await WETH.deposit({ value: ethers.parseEther("10") });
    await deposit.wait();
    //await WETH.approve(simpleSwapAddress, ethers.parseEther("1"));
    const transfer = await WETH.transfer(simpleSwapAddress, ethers.parseEther("1"))
    await transfer.wait();

     //Check Initial DAI Balance
     const DAI = new ethers.Contract(DAI_ADDRESS, ercAbi, signer);
     const expandedDAIBalanceBefore = await DAI.balanceOf(simpleSwapAddress);
     const DAIBalanceBefore = Number(ethers.formatUnits(expandedDAIBalanceBefore, DAI_DECIMALS));
     console.log("DAI Balance Before : ", DAIBalanceBefore)

    const amountIn = ethers.parseEther("0.1"); 
    const arg = [{
      tokenIn: WETH_ADDRESS,
      tokenOut: DAI_ADDRESS,
      amountIn: amountIn,
      amountOutMinimum: 0,
      poolFee: 3000
    }];
    simpleSwap.on("SwapChange", (arg1, arg2, arg3, arg4, event)=> {
      console.log("Event is", event.filter, arg1, arg2, arg3, arg4);
    });
    const swap = await simpleSwap.rebalance(arg, { gasLimit: 300000 })
    const receipt = await swap.wait(); 
    
    await new Promise(res => setTimeout(() => res(null), 5000));

    const expandedDAIBalanceAfter = await DAI.balanceOf(simpleSwapAddress);
    const DAIBalanceAfter = Number(ethers.formatUnits(expandedDAIBalanceAfter, DAI_DECIMALS));
    console.log("DAI Balance After : ", DAIBalanceAfter);
  });
  
});