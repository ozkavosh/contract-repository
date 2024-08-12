import {
  impersonateAccount,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Marketplace", function () {
  const whaleAccount = "0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa";
  const tokenContract = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const HUNDRED_THOUSAND = ethers.parseUnits("100000", 6);

  async function deployTokenFixture() {
    const token = await hre.ethers.getContractAt("IERC20", tokenContract);
    return { token };
  }

  async function deployMarketplaceFixture() {
    await impersonateAccount(whaleAccount);

    const [firstSigner, secondSigner] = await hre.ethers.getSigners();
    const { token } = await loadFixture(deployTokenFixture);

    const whale = await ethers.getSigner(whaleAccount);

    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(token.getAddress());

    await firstSigner.sendTransaction({
      to: whale.address,
      value: ethers.parseEther("100.0"),
    });

    await token.connect(whale).transfer(firstSigner.address, HUNDRED_THOUSAND);
    await token.connect(whale).transfer(secondSigner.address, HUNDRED_THOUSAND);

    const tx = await token
      .connect(secondSigner)
      .approve(await marketplace.getAddress(), HUNDRED_THOUSAND);

    await tx.wait();

    return { marketplace, firstSigner, secondSigner, token };
  }

  describe("Deployment", function () {
    it("Should have 0 products", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.productCount()).to.equal(0);
    });
  });

  describe("Product", function () {
    it("Should list a product", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      const name = "Product 1";
      const price = 100;

      await marketplace.listProduct(name, price);
      expect(await marketplace.productCount()).to.equal(1);

      const product = await marketplace.products(1);
      expect(product.name).to.equal(name);
      expect(product.price).to.equal(price * 10 ** 6);
    });

    it("Should fail to list a product with zero price", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      const name = "Product 1";
      const price = 0;

      await expect(marketplace.listProduct(name, price)).to.be.revertedWith(
        "Price must be greater than zero"
      );
    });

    it("Should buy a product", async function () {
      const { marketplace, secondSigner, token } = await loadFixture(
        deployMarketplaceFixture
      );

      const name = "Product 1";
      const price = 100;

      await marketplace.listProduct(name, price);
      expect(await marketplace.productCount()).to.equal(1);

      const product = await marketplace.products(1);

      expect(product.sold).to.equal(false);

      await marketplace
        .connect(secondSigner)
        .buyProduct(product.id, Number(product.price) / 10 ** 6);

      const updatedProduct = await marketplace.products(1);

      expect(updatedProduct.sold).to.equal(true);
      expect(updatedProduct.buyer).to.equal(secondSigner.address);
    });

    it("Should fail to buy a product that is not listed", async function () {
      const { marketplace, secondSigner } = await loadFixture(
        deployMarketplaceFixture
      );

      expect(await marketplace.productCount()).to.equal(0);

      await expect(
        marketplace.connect(secondSigner).buyProduct(1, 100)
      ).to.be.revertedWith("Product does not exist");
    });

    it("Should confirm delivery", async function () {
      const { marketplace, secondSigner } = await loadFixture(
        deployMarketplaceFixture
      );

      const name = "Product 1";
      const price = 100;

      await marketplace.listProduct(name, price);
      expect(await marketplace.productCount()).to.equal(1);

      const product = await marketplace.products(1);

      expect(product.sold).to.equal(false);
      expect(product.confirmed).to.equal(false);

      await marketplace
        .connect(secondSigner)
        .buyProduct(product.id, Number(product.price) / 10 ** 6);

      const soldProduct = await marketplace.products(1);

      expect(soldProduct.sold).to.equal(true);
      expect(soldProduct.buyer).to.equal(secondSigner.address);
      expect(soldProduct.confirmed).to.equal(false);

      await marketplace.connect(secondSigner).confirmDelivery(product.id);

      const confirmedProduct = await marketplace.products(1);

      expect(confirmedProduct.sold).to.equal(true);
    });
  });
});
