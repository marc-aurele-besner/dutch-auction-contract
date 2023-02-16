const { upgrades } = require('hardhat');
const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const MockERC20 = await hre.ethers.getContractFactory('MockERC20');
    const mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    await hre.addressBook.saveContract('MockERC20', mockERC20.address, hre.network.name, deployer.address);
    console.log('MockERC20 deployed to:', mockERC20.address);

    const DutchAuction = await hre.ethers.getContractFactory('DutchAuction');
    const dutchAuction = await upgrades.deployProxy(DutchAuction, [mockERC20.address], { initializer: 'initialize' });

    await dutchAuction.deployed();

    await hre.addressBook.saveContract('DutchAuction', dutchAuction.address, hre.network.name, deployer.address);
    console.log('DutchAuction deployed to:', dutchAuction.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });