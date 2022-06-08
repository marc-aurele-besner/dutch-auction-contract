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

  describe("Testing createAuction()", function () {
    it("createAuction() using token from mockERC721", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");

      await Helper.help_createAuction(
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

    it("createAuction() using token from mockERC721Upgradeable", async function () {
      const seller = user1;
      const tokenContract = mockERC721Upgradeable.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");

      await Helper.help_createAuction(
        seller,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate,
        endPrice,
        Helper.NFT_CONTRACT_ERC721_UPGRADEABLE,
        Helper.VERIFY_RESULT_VERIFY,
        Helper.MINT_FOR_TEST_MINT
      );
    });
  });

  describe("Testing bid()", function () {
    it("bid() on auction using mockERC721", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");
      const buyer = user2;

      await Helper.help_createAuction(
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
      await Helper.setNextTimestamp(currentTimestamp + 10);
      await Helper.rollBlocks(currentBlock + 1);

      const auctionId = await dutchAuction.getAuctionId(
        seller.address,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate
      );

      await Helper.help_bid(
        buyer,
        auctionId,
        Helper.VERIFY_RESULT_VERIFY,
        Helper.MINT_FOR_TEST_MINT
      );
    });
    it("bid() on auction using mockERC721Upgradeable", async function () {
      const seller = user1;
      const tokenContract = mockERC721Upgradeable.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");
      const buyer = user2;

      await Helper.help_createAuction(
        seller,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate,
        endPrice,
        Helper.NFT_CONTRACT_ERC721_UPGRADEABLE,
        Helper.VERIFY_RESULT_VERIFY,
        Helper.MINT_FOR_TEST_MINT
      );
      await Helper.setNextTimestamp(currentTimestamp + 10);
      await Helper.rollBlocks(currentBlock + 1);

      const auctionId = await dutchAuction.getAuctionId(
        seller.address,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate
      );

      await Helper.help_bid(
        buyer,
        auctionId,
        Helper.VERIFY_RESULT_VERIFY,
        Helper.MINT_FOR_TEST_MINT
      );
    });
  });

  describe("Testing createAuction()", function () {
    it("reclaim() on auction using mockERC721", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");

      await Helper.help_createAuction(
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

      const auctionId = await dutchAuction.getAuctionId(
        seller.address,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate
      );

      await Helper.setNextTimestamp(endDate.add(10).toNumber());
      await Helper.rollBlocks(currentBlock + 1);

      await Helper.help_reclaim(
        seller,
        auctionId,
        Helper.VERIFY_RESULT_VERIFY
      );
    });
    it("reclaim() on auction using mockERC721Upgradeable", async function () {
      const seller = user1;
      const tokenContract = mockERC721Upgradeable.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");

      await Helper.help_createAuction(
        seller,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate,
        endPrice,
        Helper.NFT_CONTRACT_ERC721_UPGRADEABLE,
        Helper.VERIFY_RESULT_VERIFY,
        Helper.MINT_FOR_TEST_MINT
      );

      const auctionId = await dutchAuction.getAuctionId(
        seller.address,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate
      );

      await Helper.setNextTimestamp(endDate.add(10).toNumber());
      await Helper.rollBlocks(currentBlock + 1);

      await Helper.help_reclaim(
        seller,
        auctionId,
        Helper.VERIFY_RESULT_VERIFY
      );
    });
  });

  describe("Testing getAuctionPrice()", function () {
    it("getAuctionPrice()", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");

      await Helper.help_createAuction(
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

      const auctionId = await dutchAuction.getAuctionId(
        seller.address,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate
      );

      Helper.help_verify_getAuctionPrice(auctionId, Helper.VERIFY_RESULT_VERIFY);
    });

    it("getAuctionPrice() try prime number", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("11");
      const endDate = ethers.BigNumber.from(100).add(currentTimestamp).add(5);
      const endPrice = ethers.utils.parseEther("4");

      await Helper.help_createAuction(
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

      const auctionId = await dutchAuction.getAuctionId(
        seller.address,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate
      );

      Helper.help_verify_getAuctionPrice(auctionId, Helper.VERIFY_RESULT_VERIFY);
    });

    it("getAuctionPrice() try zero endPrice", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = 100;
      const endDate = ethers.BigNumber.from(100).add(currentTimestamp).add(5);
      const endPrice = 0;

      await Helper.help_createAuction(
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

      const auctionId = await dutchAuction.getAuctionId(
        seller.address,
        tokenContract,
        tokenId,
        startDate,
        startPrice,
        endDate
      );

      Helper.help_verify_getAuctionPrice(auctionId, Helper.VERIFY_RESULT_VERIFY);
    });
  });

  describe("Testing for errors", function () {
    it("createAuction() without balance", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");

      let error = false;
      try {
        await Helper.help_createAuction(
          seller,
          tokenContract,
          tokenId,
          startDate,
          startPrice,
          endDate,
          endPrice,
          Helper.NFT_CONTRACT_ERC721,
          Helper.VERIFY_RESULT_VERIFY,
          Helper.MINT_FOR_TEST_DO_NOT_MINT
        );
      } catch (e) {
        error = true;
      }
      expect(error).to.be.true;
    });
    it("2x createAuction() on same tokenId", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");

      await Helper.help_createAuction(
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
      let error = false;
      try {
        await Helper.help_createAuction(
          seller,
          tokenContract,
          tokenId,
          startDate,
          startPrice,
          endDate,
          endPrice,
          Helper.NFT_CONTRACT_ERC721,
          Helper.VERIFY_RESULT_VERIFY,
          Helper.MINT_FOR_TEST_DO_NOT_MINT
        );
      } catch (e) {
        error = true;
      }
      expect(error).to.be.true;
    });
    it("2x createAuction() on same tokenId after a few blocks", async function () {
      const seller = user1;
      const tokenContract = mockERC721.address;
      const tokenId = 1;
      const startDate = ethers.BigNumber.from(5).add(currentTimestamp);
      const startPrice = ethers.utils.parseEther("10");
      const endDate = ethers.BigNumber.from(5).add(1000000).add(currentTimestamp);
      const endPrice = ethers.utils.parseEther("1");

      await Helper.help_createAuction(
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
      await Helper.rollBlocks(currentBlock + 5);
      let error = false;
      try {
        await Helper.help_createAuction(
          seller,
          tokenContract,
          tokenId,
          startDate,
          startPrice,
          endDate,
          endPrice,
          Helper.NFT_CONTRACT_ERC721,
          Helper.VERIFY_RESULT_VERIFY,
          Helper.MINT_FOR_TEST_DO_NOT_MINT
        );
      } catch (e) {
        error = true;
      }
      expect(error).to.be.true;
    });
  });
});
