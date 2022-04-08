import { expect } from "chai";
import { ethers } from "hardhat";

export default (): void => {
  it("TRADE-ROUND: Order creation works correctly", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);
    await this.instance.connect(this.acc1).createOrder(1e6, 1e3);

    const { orders } = await this.instance.getRound(2);
    const { status, amount, price, owner } = orders[0];
    const result = [status, +amount, +price, owner];
    const expectResult = [1, 1e6, 1e3, this.acc1.address];

    expect(result).to.deep.eq(expectResult);

    await this.instance.connect(this.acc1).finishOrder(0);

    const { orders: finishOrder } = await this.instance.getRound(2);
    const { status: finishStatus } = finishOrder[0];

    expect(finishStatus).to.eq(2);

    const newBalance = await this.instanceToken.balanceOf(this.acc1.address);

    expect(newBalance).to.eq(balance);
  });
  it("TRADE-ROUND: Expected custom error RoundNotProgress", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });
    await ethers.provider.send("evm_increaseTime", [600000]);

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);
    await expect(
      this.instance.connect(this.acc1).createOrder(1e6, 1e3)
    ).to.be.revertedWith("RoundNotProgress()");
  });
  it("TRADE-ROUND: Expected custom error RoundNotTrade", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance.connect(this.acc2)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);
    await this.instance.connect(this.acc1).createOrder(1e6, 1e3);
    await this.instance.connect(this.acc2).buyOrder(0, { value: 1e3 });
    await ethers.provider.send("evm_increaseTime", [600000]);
    await this.instance.connect(this.acc1).nextRound();

    await expect(
      this.instance.connect(this.acc1).createOrder(1e6, 1e3)
    ).to.be.revertedWith("RoundNotTrade()");
  });
  it("TRADE-ROUND: Expected custom error NotEnoughFunds", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);

    await expect(
      this.instance.connect(this.acc1).createOrder(balance + 1, 1e3)
    ).to.be.revertedWith("NotEnoughFunds()");
  });
  it("TRADE-ROUND: Expected error Only registered", async function (): Promise<void> {
    await expect(
      this.instance.connect(this.acc1).createOrder(1e3, 1e3)
    ).to.be.revertedWith("Only registered");
  });
  it("TRADE-ROUND: Expected custom error IncorrectAddress", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance.connect(this.acc2)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);
    await this.instance.connect(this.acc1).createOrder(1e6, 1e3);

    await expect(
      this.instance.connect(this.acc2).finishOrder(0)
    ).to.be.revertedWith("IncorrectAddress()");
  });
  it("TRADE-ROUND: Expected error Only registered", async function (): Promise<void> {
    await expect(this.instance.finishOrder(0)).to.be.revertedWith(
      "Only registered"
    );
  });
  it("TRADE-ROUND: Expected custom error RoundNotProgress", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance.connect(this.acc2)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);
    await this.instance.connect(this.acc1).createOrder(1e6, 1e3);
    await ethers.provider.send("evm_increaseTime", [600000]);
    await expect(
      this.instance.connect(this.acc2).buyOrder(0, { value: 1e3 })
    ).to.be.revertedWith("RoundNotProgress()");
  });
  it("TRADE-ROUND: Expected custom error RoundNotTrade", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance.connect(this.acc2)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);
    await this.instance.connect(this.acc1).createOrder(1e6, 1e3);
    await ethers.provider.send("evm_increaseTime", [600000]);
    await this.instance.connect(this.acc1).nextRound();

    await expect(
      this.instance.connect(this.acc2).buyOrder(0, { value: 1e3 })
    ).to.be.revertedWith("RoundNotTrade()");
  });
  it("TRADE-ROUND: Expected custom error IncorrectAmount", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance.connect(this.acc2)["registation()"]();
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);
    await this.instance.connect(this.acc1).createOrder(1e6, 1e3);

    await expect(
      this.instance.connect(this.acc2).buyOrder(0, { value: 1e4 })
    ).to.be.revertedWith("IncorrectAmount()");
  });
  it("TRADE-ROUND: Buying orders works correctly", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc2)
      ["registation(address)"](this.acc1.address);
    await this.instance
      .connect(this.acc3)
      ["registation(address)"](this.acc2.address);
    await this.instance
      .connect(this.acc1)
      .buyTokens({ value: this.bigTestAmount });

    const balance = await this.instanceToken
      .connect(this.acc1)
      .balanceOf(this.acc1.address);
    const fisrtRef = await this.instance.FIRST_REFERRAL_PERCENTAGE();
    const secondRef = await this.instance.SECOND_REFERRAL_PERCENTAGE();
    const firstAmountRef = (1e3 * fisrtRef) / 100;
    const secondAmountRef = (1e3 * secondRef) / 100;

    await this.instanceToken
      .connect(this.acc1)
      .approve(this.instance.address, balance);
    await this.instance.connect(this.acc1).createOrder(1e6, 1e3);

    const buy = await this.instance
      .connect(this.acc3)
      .buyOrder(0, { value: 1e3 });

    buy.wait();

    await expect(() => buy).to.changeEtherBalances(
      [this.acc3, this.acc2, this.acc1],
      [-1e3, firstAmountRef, secondAmountRef + 1e3]
    );
  });
};
