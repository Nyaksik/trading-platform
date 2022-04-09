import { ethers } from "hardhat";

async function main(): Promise<void> {
  const Token = await ethers.getContractFactory("TokenForTrading");
  const token = await Token.deploy();

  token.deployed();

  console.log(`The token has been deployed with an address ${token.address}`);

  const Platform = await ethers.getContractFactory("TradingPlatform");
  const platform = await Platform.deploy(token.address, 1e5);

  platform.deployed();

  console.log(
    `The platform has been deployed with an address ${platform.address}`
  );

  const contract = await ethers.getContractAt("TokenForTrading", token.address);

  await contract.changeTradingPlatform(platform.address);
  await contract.mint(platform.address, 1e5);

  console.log("Contract address changed. Minted tokens.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
