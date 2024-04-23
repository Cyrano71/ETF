import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config'

const config: HardhatUserConfig = {
  solidity: "=0.7.6",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/" + process.env.PROVIDER_KEY,
      accounts: [process.env.MY_PRIVATE_KEY as string]
    }
  }
};

export default config;