const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    // Set the token address to use for payment (ERC20)
    const token = ethers.constants.AddressZero;

    const DutchAuction = await hre.ethers.getContractFactory('DutchAuction');
    const dutchAuction = await DutchAuction.deploy();

    await dutchAuction.deployed();
    await dutchAuction.initialize(token);
    await hre.addressBook.saveContract('DutchAuction', dutchAuction.address, hre.network.name, deployer.address);

    console.log('DutchAuction deployed to:', dutchAuction.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });