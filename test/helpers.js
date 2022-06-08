const { expect } = require("chai");
const { ethers } = require("hardhat");

const TOKEN_TYPE_ERC721 = 0;

const AUCTION_STATUS_NOT_ASSIGNED = 0;
const AUCTION_STATUS_STARTED = 1;
const AUCTION_STATUS_SOLD = 2;
const AUCTION_STATUS_CLOSED = 3;

const MINT_FOR_TEST_DO_NOT_MINT = false;
const MINT_FOR_TEST_MINT = true;

const VERIFY_RESULT_DO_NOT_VERIFY = false;
const VERIFY_RESULT_VERIFY = true;

const NFT_CONTRACT_ERC721 = "ERC721";
const NFT_CONTRACT_ERC721_UPGRADEABLE = "ERC721Upgradeable";

let provider;

let dutchAuction;
let mockERC20;
let mockERC721;
let mockERC721Upgradeable;

let nftContracts = [];

const setupProviderAndAccount = async () => {
    if (network.name === 'hardhat')
        provider = ethers.provider;
    else
        provider = new ethers.providers.JsonRpcProvider(network.config.url);

    const owner = new ethers.Wallet(
        ethers.Wallet.fromMnemonic(network.config.accounts.mnemonic, `m/44'/60'/0'/0/0`).privateKey,
        provider
    );
    const user1 = new ethers.Wallet(
        ethers.Wallet.fromMnemonic(network.config.accounts.mnemonic, `m/44'/60'/0'/0/1`).privateKey,
        provider
    );
    const user2 = new ethers.Wallet(
        ethers.Wallet.fromMnemonic(network.config.accounts.mnemonic, `m/44'/60'/0'/0/2`).privateKey,
        provider
    );
    const user3 = new ethers.Wallet(
        ethers.Wallet.fromMnemonic(network.config.accounts.mnemonic, `m/44'/60'/0'/0/3`).privateKey,
        provider
    );
    return [provider, owner, user1, user2, user3];
};

const setupContract = async () => {
    // Get contract artifacts
    const DutchAuction = await ethers.getContractFactory("DutchAuction");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const MockERC721Upgradeable = await ethers.getContractFactory("MockERC721Upgradeable");

    // Deploy contracts
    dutchAuction = await DutchAuction.deploy();
    // Deploy mock contracts
    mockERC20 = await MockERC20.deploy();
    mockERC721 = await MockERC721.deploy();
    mockERC721Upgradeable = await MockERC721Upgradeable.deploy();

    await mockERC20.deployed();
    await mockERC721.deployed();
    await mockERC721Upgradeable.deployed();

    await dutchAuction.deployed();

    // Initialize mocks contracts
    await mockERC721Upgradeable.initialize("MockERC721Upgradeable", "MOCK721");

    // Initialize contracts
    await dutchAuction.initialize(mockERC20.address);

    // Add some valid nfts contracts to the auction contract
    await dutchAuction.setNftContract(mockERC721.address, true);
    await dutchAuction.setNftContract(mockERC721Upgradeable.address, true);

    return [mockERC20, mockERC721, mockERC721Upgradeable, dutchAuction];
};

const help_createAuction = async (seller_, tokenContract_, tokenId_, startDate_, startPrice_, endDate_, endPrice_, nftContractType_, verification_, mintForTest_) => {
    if(mintForTest_) {
        if(nftContractType_ == NFT_CONTRACT_ERC721) {
            await mockERC721.mint(seller_.address, tokenId_);
            await mockERC721.connect(seller_).approve(dutchAuction.address, tokenId_);
        } else if(nftContractType_ == NFT_CONTRACT_ERC721_UPGRADEABLE) {
            await mockERC721Upgradeable.mint(seller_.address, tokenId_);
            await mockERC721Upgradeable.connect(seller_).approve(dutchAuction.address, tokenId_);
        }
    }

    await dutchAuction.connect(seller_).createAuction(
        TOKEN_TYPE_ERC721,
        tokenContract_,
        tokenId_,
        startDate_,
        startPrice_,
        endDate_,
        endPrice_
    );
    const auctionId = await dutchAuction.getAuctionId(seller_, tokenContract_, tokenId_, startDate_, startPrice_, endDate_);
    nftContracts[auctionId] = nftContractType_;

    if (verification_) {
        const auction = await dutchAuction.getAuction(auctionId);
        expect(auction.status).to.be.equal(AUCTION_STATUS_STARTED);
        if (nftContracts[auctionId] == NFT_CONTRACT_ERC721) {
            expect(auction.tokenContract).to.be.equal(mockERC721.address);
            expect(await mockERC721.ownerOf(auction.tokenId)).to.be.equal(dutchAuction.address);
        }
        if (nftContracts[auctionId] == NFT_CONTRACT_ERC721_UPGRADEABLE) {
            expect(auction.tokenContract).to.be.equal(mockERC721Upgradeable.address);
            expect(await mockERC721Upgradeable.ownerOf(auction.tokenId)).to.be.equal(dutchAuction.address);
        }
    }
}

const help_bid = async (buyer_, auctionId_, verification_, mintForTest_) => {
    const sellPrice = await dutchAuction.getAuctionPrice(auctionId_);

    if(mintForTest_) {
        await mockERC20.mint(buyer_, sellPrice);
    }
    const originalTokenBalance = await mockERC20.balanceOf(buyer_);

    await mockERC20.connect(buyer_).approve(address(dutchAuction), sellPrice);

    await dutchAuction.connect(buyer_).bid(auctionId_);

    if (verification_) {
        const auction = await dutchAuction.getAuction(auctionId_);
        expect(auction.status == DAUCTION_STATUS_SOLD);
        if (nftContracts[auctionId_] == NFT_CONTRACT_ERC721)
            expect(await mockERC721.ownerOf(auction.tokenId)).to.be.equal(buyer_.address);
        if (nftContracts[auctionId_] == NFT_CONTRACT_ERC721_UPGRADEABLE)
            expect(await mockERC721Upgradeable.ownerOf(auction.tokenId)).to.be.equal(buyer_.address);
        expect(await mockERC20.balanceOf(buyer_)).to.be.equal(ethers.BigNumber.from(originalTokenBalance).sub(sellPrice));
    }
}

const help_reclaim = async (seller_, auctionId_, verification_) => {
    await dutchAuction.connect(seller_).reclaim(auctionId_);

    if (verification_) {
        const auction = await dutchAuction.getAuction(auctionId_);
        expect(auction.status == AUCTION_STATUS_CLOSED);
        
        if (nftContracts[auctionId_] == NFT_CONTRACT_ERC721)
            expect(await mockERC721.ownerOf(auction.tokenId)).to.be.equal(auction.tokenOwner);
        if (nftContracts[auctionId_] == NFT_CONTRACT_ERC721_UPGRADEABLE)
            expect(await mockERC721Upgradeable.ownerOf(auction.tokenId)).to.be.equal(auction.tokenOwner);
    }
}

const help_calculatePrice = (startPrice_, endPrice_, startDate_, endDate_) => {
    if(endPrice_ == 0) {
        return startPrice_ / (endDate_ - startDate_) * (endDate_ - block.timestamp);
    }
    return ((startPrice_ - endPrice_) / 
            (endDate_ - startDate_) * 
            (endDate_ - block.timestamp) +
            endPrice_);
}

const help_verify_getAuctionPrice = async (auctionId_, verification_) => {
    const auction = await dutchAuction.getAuction(auctionId_);
    const currentTime = block.timestamp;
    while(currentTime <= auction.endDate) {
        setNextTimestamp(currentTime);

        currentTime += (auction.endDate - auction.startDate) / LOOP_COUNT_PRICE_VERIFICATION;
        const sellPrice = await dutchAuction.getAuctionPrice(auctionId_);
        // console.log("timestamp, sellPrice", block.timestamp, sellPrice);

        if (verification_) {
            expect(sellPrice).to.be.equal(help_calculatePrice(auction.startPrice, auction.endPrice, auction.startDate, auction.endDate));
        }
    }
}

const rollBlocks = async (numberOfBlock) => {
    const currentBlock = await provider.getBlockNumber();
    let temp = currentBlock;
    while (temp < currentBlock + numberOfBlock) {
        if (network.name === 'hardhat') {
            // Mine 1 block
            await provider.send('evm_mine');
        } else {
            // wait 14 seconds
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
        temp = await provider.getBlockNumber();
    }
};

const setNextTimestamp = async (timestamp) => {
    await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await network.provider.send("evm_mine");
}

module.exports = {
    // Constants
    AUCTION_STATUS_NOT_ASSIGNED,
    AUCTION_STATUS_STARTED,
    AUCTION_STATUS_SOLD,
    MINT_FOR_TEST_DO_NOT_MINT,
    MINT_FOR_TEST_MINT,
    VERIFY_RESULT_DO_NOT_VERIFY,
    VERIFY_RESULT_VERIFY,
    NFT_CONTRACT_ERC721,
    NFT_CONTRACT_ERC721_UPGRADEABLE,
    // Functions
    setupProviderAndAccount,
    setupContract,
    help_createAuction,
    help_bid,
    help_reclaim,
    help_calculatePrice,
    help_verify_getAuctionPrice,
    rollBlocks,
    setNextTimestamp
};