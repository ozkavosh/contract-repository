import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Marketplace", function () {
  async function deployMarketplaceFixture() {
    const [firstSigner, secondSigner] = await hre.ethers.getSigners();

    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy();

    return { marketplace, firstSigner, secondSigner };
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
      expect(product.price).to.equal(price);
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
      const { marketplace, secondSigner } = await loadFixture(
        deployMarketplaceFixture
      );

      const name = "Product 1";
      const price = 100;

      await marketplace.listProduct(name, price);
      expect(await marketplace.productCount()).to.equal(1);

      const product = await marketplace.products(1);

      expect(product.sold).to.equal(false);

      await marketplace.connect(secondSigner).buyProduct(product.id, {
        value: product.price,
      });

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
        marketplace.connect(secondSigner).buyProduct(1, {
          value: 0,
        })
      ).to.be.revertedWith("Invalid product");
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

      await marketplace.connect(secondSigner).buyProduct(product.id, {
        value: product.price,
      });

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
