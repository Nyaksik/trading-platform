import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";
import registration from "./registration";
import saleRound from "./saleRound";
import tradeRound from "./tradeRound";

export default describe("Trading platform testing", async function () {
  before(async function () {
    [this.owner, this.acc1, this.acc2, this.acc3] = await ethers.getSigners();
    this.supply = 1e5;
    this.testAmount = 1e18;
    this.minTestAmount = 1e17;
    this.errorAmount = 1e12;
  });
  beforeEach(async function () {
    const artifactToken: Artifact = await artifacts.readArtifact(
      "TokenForTrading"
    );
    this.instanceToken = await waffle.deployContract(this.owner, artifactToken);
    const artifact: Artifact = await artifacts.readArtifact("TradingPlatform");
    this.instance = await waffle.deployContract(this.owner, artifact, [
      this.instanceToken.address,
      this.supply,
    ]);
    await this.instanceToken.changeTradingPlatform(this.instance.address);
    await this.instanceToken.mint(this.instance.address, this.supply);
  });
  registration();
  saleRound();
  tradeRound();
});
