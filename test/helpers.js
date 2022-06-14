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

const TEST_CASES_DATA = [
    {
      seller: "user1",
      tokenId: 1,
      startDate: ethers.BigNumber.from(5),
      startPrice: "200",
      endDate: ethers.BigNumber.from(5).add(10),
      endPrice: "1",
      buyer: "user2"
    },
    {
      seller: "user2",
      tokenId: 2,
      startDate: ethers.BigNumber.from(5),
      startPrice: "100",
      endDate: ethers.BigNumber.from(5).add(100),
      endPrice: "50",
      buyer: "owner"
    },
    {
      seller: "owner",
      tokenId: 3,
      startDate: ethers.BigNumber.from(5),
      startPrice: "99",
      endDate: ethers.BigNumber.from(5).add(200),
      endPrice: "1",
      buyer: "user3"
    },
    {
      seller: "user3",
      tokenId: 3,
      startDate: ethers.BigNumber.from(5),
      startPrice: "0.5",
      endDate: ethers.BigNumber.from(5).add(200),
      endPrice: "0.25",
      buyer: "user1"
    },
    {
      seller: "user3",
      tokenId: 3,
      startDate: ethers.BigNumber.from(5),
      startPrice: "1",
      endDate: ethers.BigNumber.from(5).add(300),
      endPrice: "0.5",
      buyer: "user2"
    },
    {
      seller: "user2",
      tokenId: 1,
      startDate: ethers.BigNumber.from(5),
      startPrice: "99",
      endDate: ethers.BigNumber.from(5).add(500),
      endPrice: "0.0099",
      buyer: "user1"
    },
    {
      seller: "user3",
      tokenId: 7,
      startDate: ethers.BigNumber.from(50),
      startPrice: "100",
      endDate: ethers.BigNumber.from(5).add(2000),
      endPrice: "0.1",
      buyer: "user2"
    },
    {
      seller: "user1",
      tokenId: 12,
      startDate: ethers.BigNumber.from(45),
      startPrice: "19",
      endDate: ethers.BigNumber.from(5).add(50000),
      endPrice: "0.0019",
      buyer: "user2"
    },
    {
      seller: "user2",
      tokenId: 25,
      startDate: ethers.BigNumber.from(5),
      startPrice: "1",
      endDate: ethers.BigNumber.from(5).add(15000),
      endPrice: "0.001",
      buyer: "user3"
    },
    {
      seller: "user3",
      tokenId: 100,
      startDate: ethers.BigNumber.from(5),
      startPrice: "1",
      endDate: ethers.BigNumber.from(5).add(1000000),
      endPrice: "0.001",
      buyer: "user1"
    },
    {
      seller: "owner",
      tokenId: 500,
      startDate: ethers.BigNumber.from(5),
      startPrice: "1",
      endDate: ethers.BigNumber.from(5).add(2000000),
      endPrice: "0",
      buyer: "user1"
    },
    {
      seller: "user2",
      tokenId: 999,
      startDate: ethers.BigNumber.from(5),
      startPrice: "0.1",
      endDate: ethers.BigNumber.from(5).add(3000000),
      endPrice: "0",
      buyer: "user3"
    }
];

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

const help_mint = async (signer_, address_, amount_, nftContractType_) => {
    if(nftContractType_ == NFT_CONTRACT_ERC721)
        await mockERC721.connect(signer_).mint(address_, amount_);
    if(nftContractType_ == NFT_CONTRACT_ERC721_UPGRADEABLE)
        await mockERC721Upgradeable.connect(signer_).mint(address_, amount_);
}

const help_createAuction = async (seller_, tokenContract_, tokenId_, startDate_, startPrice_, endDate_, endPrice_, nftContractType_, verification_, mintForTest_) => {
    if(mintForTest_ == MINT_FOR_TEST_MINT) {
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
    const auctionId = await dutchAuction.getAuctionId(seller_.address, tokenContract_, tokenId_, startDate_, startPrice_, endDate_);
    nftContracts[auctionId] = nftContractType_;

    if (verification_ == VERIFY_RESULT_VERIFY) {
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

    if(mintForTest_ == MINT_FOR_TEST_MINT) {
        await mockERC20.mint(buyer_.address, sellPrice);
    }

    await mockERC20.connect(buyer_).approve(dutchAuction.address, sellPrice);

    await dutchAuction.connect(buyer_).bid(auctionId_);

    if (verification_ == VERIFY_RESULT_VERIFY) {
        const auction = await dutchAuction.getAuction(auctionId_);
        expect(auction.status == AUCTION_STATUS_SOLD);
        if (nftContracts[auctionId_] == NFT_CONTRACT_ERC721)
            expect(await mockERC721.ownerOf(auction.tokenId)).to.be.equal(buyer_.address);
        if (nftContracts[auctionId_] == NFT_CONTRACT_ERC721_UPGRADEABLE)
            expect(await mockERC721Upgradeable.ownerOf(auction.tokenId)).to.be.equal(buyer_.address);
        expect(await mockERC20.balanceOf(buyer_.address)).to.be.gt(ethers.BigNumber.from(0));
    }
}

const help_reclaim = async (seller_, auctionId_, verification_) => {
    await dutchAuction.connect(seller_).reclaim(auctionId_);

    if (verification_ == VERIFY_RESULT_VERIFY) {
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
    let currentTime;
    while(currentTime <= auction.endDate) {
        if (currentTime) 
            setNextTimestamp(currentTime);

        currentTime += (auction.endDate - auction.startDate) / LOOP_COUNT_PRICE_VERIFICATION;
        const sellPrice = await dutchAuction.getAuctionPrice(auctionId_);
        // console.log("timestamp, sellPrice", block.timestamp, sellPrice);

        if (verification_ == VERIFY_RESULT_VERIFY) {
            expect(sellPrice).to.be.equal(help_calculatePrice(auction.startPrice, auction.endPrice, auction.startDate, auction.endDate));
        }
    }
}

const setNextTimestamp = async (timestamp) => {
    await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await network.provider.send("evm_mine");
}

const serveUser = async (userWanted, owner, user1, user2, user3) => {
    if (userWanted == "owner")
        return owner;
    if (userWanted == "user1")
        return user1;
    if (userWanted == "user2")
        return user2;
    if (userWanted == "user3")
        return user3;
}

module.exports = {
    // Constants
    TEST_CASES_DATA,
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
    help_mint,
    help_createAuction,
    help_bid,
    help_reclaim,
    help_calculatePrice,
    help_verify_getAuctionPrice,
    setNextTimestamp,
    serveUser
};