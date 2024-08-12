import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MarketplaceModule = buildModule("MarketplaceModule", (module) => {
  const contract = module.contract("Marketplace", [
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  ]);

  return { contract };
});

export default MarketplaceModule;
