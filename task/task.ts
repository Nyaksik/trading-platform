import { task } from "hardhat/config";

task("registation", "Registration on the platform").setAction(
  async (_, { ethers }) => {
    const platform = await ethers.getContractAt(
      "TradingPlatform",
      process.env.PLATFORM_ADDRESS as string
    );

    await platform["registation()"];

    console.log("Are you registered");
  }
);

task("buy", "Buying tokens in the sale round")
  .addParam("eth", "Ethereum amount")
  .setAction(async ({ eth }, { ethers }) => {
    const platform = await ethers.getContractAt(
      "TradingPlatform",
      process.env.PLATFORM_ADDRESS as string
    );

    await platform.buyTokens(eth);

    console.log(`You bought tokens for ${eth}`);
  });

task("create", "Create order")
  .addParam("amount", "Amount of tokens for sale")
  .addParam("price", "Ethereum token price")
  .setAction(async ({ amount, price }, { ethers }) => {
    const platform = await ethers.getContractAt(
      "TradingPlatform",
      process.env.PLATFORM_ADDRESS as string
    );

    await platform.createOrder(amount, price);

    console.log("Order is up for sale");
  });

task("buyOrder", "Purchase order")
  .addParam("id", "Order ID")
  .setAction(async ({ id }, { ethers }) => {
    const platform = await ethers.getContractAt(
      "TradingPlatform",
      process.env.PLATFORM_ADDRESS as string
    );

    await platform.buyOrder(id);

    console.log(`Order with id ${id} purchased`);
  });

task("finish", "Cancel the order")
  .addParam("id", "Order ID")
  .setAction(async ({ id }, { ethers }) => {
    const platform = await ethers.getContractAt(
      "TradingPlatform",
      process.env.PLATFORM_ADDRESS as string
    );

    await platform.finishOrder(id);

    console.log(`Order with id ${id} canceled`);
  });
