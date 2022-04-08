import { expect } from "chai";
import { ethers } from "hardhat";

export default (): void => {
  it("SALE-ROUND: Buying tokens works correctly", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc2)
      ["registation(address)"](this.acc1.address);
    await this.instance
      .connect(this.acc3)
      ["registation(address)"](this.acc2.address);

    const { tokenPrice } = await this.instance.getRound(1);
    const tokenAmount = this.testAmount / tokenPrice;
    const fisrtRef = await this.instance.FIRST_REFERRAL_PERCENTAGE();
    const secondRef = await this.instance.SECOND_REFERRAL_PERCENTAGE();
    const firstAmountRef = (this.testAmount * fisrtRef) / 100;
    const secondAmountRef = (this.testAmount * secondRef) / 100;

    const buy = await this.instance
      .connect(this.acc3)
      .buyTokens({ value: BigInt(this.testAmount) });

    await buy.wait();

    await expect(() => buy).to.changeEtherBalances(
      [this.acc3, this.acc2, this.acc1],
      [
        BigInt(-this.testAmount),
        BigInt(firstAmountRef),
        BigInt(secondAmountRef),
      ]
    );

    const balance = await this.instanceToken.balanceOf(this.acc3.address);

    expect(balance).to.eq(tokenAmount);
  });
  it("SALE-ROUND: Expected custom error RoundNotProgress", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await ethers.provider.send("evm_increaseTime", [600000]);

    await expect(
      this.instance
        .connect(this.acc1)
        .buyTokens({ value: BigInt(this.testAmount) })
    ).to.be.revertedWith("RoundNotProgress()");
  });
  it("SALE-ROUND: Expected custom error RoundNotSale", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: BigInt(this.testAmount) });

    await expect(
      this.instance
        .connect(this.acc1)
        .buyTokens({ value: BigInt(this.testAmount) })
    ).to.be.revertedWith("RoundNotSale()");
  });
  it("SALE-ROUND: Expected custom error NoSupply", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: BigInt(this.minTestAmount) });
    await expect(
      this.instance
        .connect(this.acc1)
        .buyTokens({ value: BigInt(this.testAmount) })
    ).to.be.revertedWith("NoSupply()");
  });
  it("SALE-ROUND: Expected error onlyRegistered", async function (): Promise<void> {
    await expect(
      this.instance
        .connect(this.acc1)
        .buyTokens({ value: BigInt(this.testAmount) })
    ).to.be.revertedWith("Only registered");
  });
  it("SALE-ROUND: Tokens are expected to burn at the end of the round", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();

    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: BigInt(this.testAmount) });
    await ethers.provider.send("evm_increaseTime", [600000]);
    await this.instance.connect(this.acc1).nextRound();

    const balance = await this.instanceToken.balanceOf(this.instance.address);

    expect(balance).to.eq(0);
  });
  it("SALE-ROUND: Expected custom error NoSupply", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();

    await expect(
      this.instance.connect(this.acc1).buyTokens({ value: this.errorAmount })
    ).to.be.revertedWith("IncorrectAmount()");
  });
};
