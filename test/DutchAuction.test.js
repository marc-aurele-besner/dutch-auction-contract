const { expect } = require("chai");
const { ethers } = require("hardhat");
const Helper = require("./helpers");

let provider;
let owner;
let user1;
let user2;
let user3;

let mockERC20;
let mockERC721;
let mockERC721Upgradeable;
let dutchAuction;

let currentBlock;
let currentTimestamp;

describe("DutchAuction", function () {
  before(async function () {
    [provider, owner, user1, user2, user3] = await Helper.setupProviderAndAccount();
  });

  beforeEach(async function () {
    [mockERC20, mockERC721, mockERC721Upgradeable, dutchAuction] = await Helper.setupContract();
    
    currentBlock = await ethers.provider.getBlockNumber();
    currentTimestamp = (await ethers.provider.getBlock(currentBlock)).timestamp;
  });

  it("createAuction()", async function () {
    const seller = user1.address;
    const tokenContract = mockERC721.address;
    const tokenId = 1;
    const startDate = currentTimestamp;
    const startPrice = ethers.utils.parseEther("10");
    const endDate = ethers.BigNumber.from(1000000).add(currentTimestamp);
    const endPrice = ethers.utils.parseEther("1");

    Helper.help_createAuction(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate,
      endPrice,
      Helper.NFT_CONTRACT_ERC721,
      Helper.VERIFY_RESULT_VERIFY,
      Helper.MINT_FOR_TEST_MINT
    );
  });

  it("bid()", async function () {
    const seller = user1.address;
    const tokenContract = mockERC721.address;
    const tokenId = 1;
    const startDate = currentTimestamp;
    const startPrice = ethers.utils.parseEther("10");
    const endDate = ethers.BigNumber.from(1000000).add(currentTimestamp);
    const endPrice = ethers.utils.parseEther("1");
    const buyer = user2.address;

    Helper.help_createAuction(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate,
      endPrice,
      Helper.NFT_CONTRACT_ERC721,
      Helper.VERIFY_RESULT_VERIFY,
      Helper.MINT_FOR_TEST_MINT
    );
    Helper.setNextTimestamp(currentTimestamp + 10);
    Helper.rollBlocks(currentBlock + 1);

    const auctionId = dutchAuction.getAuctionId(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate
    );

    Helper.help_bid(
      buyer,
      auctionId,
      Helper.VERIFY_RESULT_VERIFY,
      Helper.MINT_FOR_TEST_MINT
    );
  });

  it("reclaim()", async function () {
    const seller = user1.address;
    const tokenContract = mockERC721.address;
    const tokenId = 1;
    const startDate = currentTimestamp;
    const startPrice = ethers.utils.parseEther("10");
    const endDate = ethers.BigNumber.from(1000000).add(currentTimestamp);
    const endPrice = ethers.utils.parseEther("1");

    Helper.help_createAuction(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate,
      endPrice,
      Helper.NFT_CONTRACT_ERC721,
      Helper.VERIFY_RESULT_VERIFY,
      Helper.MINT_FOR_TEST_MINT
    );
    Helper.setNextTimestamp(currentTimestamp + 10);
    Helper.rollBlocks(currentBlock + 1);

    const auctionId = dutchAuction.getAuctionId(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate
    );

    Helper.help_reclaim(
      seller,
      auctionId,
      Helper.VERIFY_RESULT_VERIFY
    );
  });

  it("getAuctionPrice()", async function () {
    const seller = user1.address;
    const tokenContract = mockERC721.address;
    const tokenId = 1;
    const startDate = currentTimestamp;
    const startPrice = ethers.utils.parseEther("10");
    const endDate = ethers.BigNumber.from(1000000).add(currentTimestamp);
    const endPrice = ethers.utils.parseEther("1");

    Helper.help_createAuction(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate,
      endPrice,
      Helper.NFT_CONTRACT_ERC721,
      Helper.VERIFY_RESULT_VERIFY,
      Helper.MINT_FOR_TEST_MINT
    );

    const auctionId = dutchAuction.getAuctionId(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate
    );

    Helper.help_verify_getAuctionPrice(auctionId, Helper.VERIFY_RESULT_VERIFY);
  });

  it("getAuctionPrice() try prime number", async function () {
    const seller = user1.address;
    const tokenContract = mockERC721.address;
    const tokenId = 1;
    const startDate = currentTimestamp;
    const startPrice = ethers.utils.parseEther("11");
    const endDate = ethers.BigNumber.from(100).add(currentTimestamp);
    const endPrice = ethers.utils.parseEther("4");

    Helper.help_createAuction(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate,
      endPrice,
      Helper.NFT_CONTRACT_ERC721,
      Helper.VERIFY_RESULT_VERIFY,
      Helper.MINT_FOR_TEST_MINT
    );

    const auctionId = dutchAuction.getAuctionId(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate
    );

    Helper.help_verify_getAuctionPrice(auctionId, Helper.VERIFY_RESULT_VERIFY);
  });

  it("getAuctionPrice() try zero endPrice", async function () {
    const seller = user1.address;
    const tokenContract = mockERC721.address;
    const tokenId = 1;
    const startDate = currentTimestamp;
    const startPrice = 100;
    const endDate = ethers.BigNumber.from(100).add(currentTimestamp);
    const endPrice = 0;

    Helper.help_createAuction(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate,
      endPrice,
      Helper.NFT_CONTRACT_ERC721,
      Helper.VERIFY_RESULT_VERIFY,
      Helper.MINT_FOR_TEST_MINT
    );

    const auctionId = dutchAuction.getAuctionId(
      seller,
      tokenContract,
      tokenId,
      startDate,
      startPrice,
      endDate
    );

    Helper.help_verify_getAuctionPrice(auctionId, Helper.VERIFY_RESULT_VERIFY);
  });
});
