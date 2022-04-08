import { expect } from "chai";

export default (): void => {
  it("REGISTRATION: Registration without referrer works correctly", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();

    const user = await this.instance.getUser(this.acc1.address);

    expect(user.registered).to.eq(true);
  });
  it("REGISTRATION: Registering without a referrer is expected to return custom error AlreadyRegistered", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();

    await expect(
      this.instance.connect(this.acc1)["registation()"]()
    ).to.be.revertedWith("AlreadyRegistered()");
  });
  it("REGISTRATION: Registration with referrer works correctly", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc2)
      ["registation(address)"](this.acc1.address);

    const user = await this.instance.getUser(this.acc2.address);

    expect(user.refers.length).to.eq(1);
  });
  it("REGISTRATION: Registration with referrer works correctly", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc2)
      ["registation(address)"](this.acc1.address);
    await this.instance
      .connect(this.acc3)
      ["registation(address)"](this.acc2.address);

    const user = await this.instance.getUser(this.acc3.address);

    expect(user.refers.length).to.eq(2);
  });
  it("REGISTRATION: Registering with a referrer is expected to return custom error AlreadyRegistered", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();
    await this.instance
      .connect(this.acc2)
      ["registation(address)"](this.acc1.address);

    await expect(
      this.instance
        .connect(this.acc2)
        ["registation(address)"](this.acc1.address)
    ).to.be.revertedWith("AlreadyRegistered()");
  });
  it("REGISTRATION: Registering with a referrer is expected to return custom error IncorrectAddress", async function (): Promise<void> {
    await this.instance.connect(this.acc1)["registation()"]();

    await expect(
      this.instance
        .connect(this.acc2)
        ["registation(address)"](this.acc2.address)
    ).to.be.revertedWith("IncorrectAddress()");
  });
};
