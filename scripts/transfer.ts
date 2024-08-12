import { ethers, network } from "hardhat";
import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const USDC_WHALE = "0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa";

async function main() {
  await impersonateAccount(USDC_WHALE);

  const whale = await ethers.getSigner(USDC_WHALE);
  const usdc = await ethers.getContractAt("IERC20", USDC);

  const accounts = await ethers.getSigners();
  const attacker = accounts[1];

  const HUNDRED_THOUSAND = ethers.parseUnits("100000", 6);

  let whaleBal = await usdc.balanceOf(USDC_WHALE);
  let attackerBal = await usdc.balanceOf(attacker.address);

  console.log("USDC Contract", await usdc.getAddress());
  console.log(
    "Initial USDC balance of whale : ",
    ethers.formatUnits(whaleBal, 6)
  );

  console.log("Attacker address: ", attacker.address);

  console.log(
    "Initial USDC balance of attacker : ",
    ethers.formatUnits(attackerBal, 6)
  );

  await accounts[1].sendTransaction({
    to: whale.address,
    value: ethers.parseEther("50.0"), // Sends exactly 50.0 ether
  });

  await usdc.connect(whale).transfer(accounts[1].address, HUNDRED_THOUSAND);

  let newWhaleBal = await usdc.balanceOf(USDC_WHALE);
  let newAttackerBal = await usdc.balanceOf(attacker.address);

  console.log(
    "Final USDC balance of whale : ",
    ethers.formatUnits(newWhaleBal, 6)
  );

  console.log(
    "Final USDC balance of attacker : ",
    ethers.formatUnits(newAttackerBal, 6)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
