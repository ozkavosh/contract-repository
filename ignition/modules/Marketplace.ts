import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MarketplaceModule = buildModule("MarketplaceUSDCModule", (module) => {
  const contract = module.contract("Marketplace");

  return { contract };
});

export default MarketplaceModule;
