// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title MockERC721 - Test
 */

// import "hardhat/console.sol";
import "./utils/console.sol";
import "./utils/stdlib.sol";
import "./utils/test.sol";
import {CheatCodes} from "./utils/cheatcodes.sol";

import { DutchAuction, IERC20Upgradeable } from "../DutchAuction.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { MockERC721 } from "../mocks/MockERC721.sol";
import { MockERC721Upgradeable } from "../mocks/MockERC721Upgradeable.sol";

contract SetupTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    DutchAuction public dutchAuction;
    MockERC20 public mockERC20;
    MockERC721 public mockERC721;
    MockERC721Upgradeable public mockERC721Upgradeable;

    enum AUCTION_STATUS {
        NOT_ASSIGNED,
        STARTED,
        SOLD
    }

    enum VERIFY_RESULT {
        DO_NOT_VERIFY,
        VERIFY
    }

    enum MINT_FOR_TEST {
        DO_NOT_MINT,
        MINT
    }

    enum NFT_CONTRACT {
        ERC721,
        ERC721_UPGRADEABLE
    }

    uint16 constant LOOP_COUNT_PRICE_VERIFICATION = 10;

    mapping(uint256 => NFT_CONTRACT) public nftContracts;

    function deployAndInitializeAllContracts() public {
        // Set block.number and block.timestamp to 1 instead of 0
        vm.roll(1);
        vm.warp(1);

        // Deploy contracts
        dutchAuction = new DutchAuction();

        // Deploy mock contracts
        mockERC20 = new MockERC20();
        mockERC721 = new MockERC721();
        mockERC721Upgradeable = new MockERC721Upgradeable();

        // Initialize mocks contracts
        mockERC721Upgradeable.initialize("MockERC721Upgradeable", "MOCK721");

        // Initialize contracts
        dutchAuction.initialize(IERC20Upgradeable(address(mockERC20)));

        // Add some valid nfts contracts to the auction contract
        dutchAuction.setNftContract(address(mockERC721), true);
        dutchAuction.setNftContract(address(mockERC721Upgradeable), true);
    }

    function help_createAuction(
        address seller_,
        address tokenContract_,
        uint256 tokenId_,
        uint256 startDate_,
        uint256 startPrice_,
        uint256 endDate_,
        uint256 endPrice_,
        NFT_CONTRACT nftContractType_,
        VERIFY_RESULT verification_,
        MINT_FOR_TEST mintForTest_
    ) public {
        if(mintForTest_ == MINT_FOR_TEST.MINT) {
            mockERC721.mint(seller_, tokenId_);
        }
        vm.prank(seller_);
        mockERC721.approve(address(dutchAuction), tokenId_);

        vm.prank(seller_);
        dutchAuction.createAuction(
            DutchAuction.TOKEN_TYPE.ERC721,
            tokenContract_,
            tokenId_,
            startDate_,
            startPrice_,
            endDate_,
            endPrice_
        );
        uint256 auctionId = dutchAuction.getAuctionId(seller_, tokenContract_, tokenId_, startDate_, startPrice_, endDate_);
        nftContracts[auctionId] = nftContractType_;

        if (verification_ == VERIFY_RESULT.VERIFY) {
            DutchAuction.Auctions memory auction = dutchAuction.getAuction(auctionId);
            assertTrue(auction.status == DutchAuction.AUCTION_STATUS.STARTED);
            if (nftContracts[auctionId] == NFT_CONTRACT.ERC721) {
                assertTrue(auction.tokenContract == address(mockERC721));
                assertEq(mockERC721.ownerOf(auction.tokenId), address(dutchAuction));
            }
            if (nftContracts[auctionId] == NFT_CONTRACT.ERC721_UPGRADEABLE) {
                assertTrue(auction.tokenContract == address(mockERC721Upgradeable));
                assertEq(mockERC721Upgradeable.ownerOf(auction.tokenId), address(dutchAuction));
            }
        }
    }

    function help_bid(
        address buyer_,
        uint256 auctionId_,
        VERIFY_RESULT verification_,
        MINT_FOR_TEST mintForTest_
    ) public {
        uint256 sellPrice = dutchAuction.getAuctionPrice(auctionId_);

        if(mintForTest_ == MINT_FOR_TEST.MINT) {
            mockERC20.mint(buyer_, sellPrice);
        }
        uint256 originalTokenBalance = mockERC20.balanceOf(buyer_);

        vm.prank(buyer_);
        mockERC20.approve(address(dutchAuction), sellPrice);

        vm.prank(buyer_);
        dutchAuction.bid(auctionId_);

        if (verification_ == VERIFY_RESULT.VERIFY) {
            DutchAuction.Auctions memory auction = dutchAuction.getAuction(auctionId_);
            assertTrue(auction.status == DutchAuction.AUCTION_STATUS.SOLD);
            if (nftContracts[auctionId_] == NFT_CONTRACT.ERC721)
                assertEq(mockERC721.ownerOf(auction.tokenId), buyer_);
            if (nftContracts[auctionId_] == NFT_CONTRACT.ERC721_UPGRADEABLE)
                assertEq(mockERC721Upgradeable.ownerOf(auction.tokenId), buyer_);
            assertEq(mockERC20.balanceOf(buyer_), originalTokenBalance - sellPrice);
        }
    }

    function help_reclaim(
        address seller_,
        uint256 auctionId_,
        VERIFY_RESULT verification_
    ) public {
        vm.prank(seller_);
        dutchAuction.reclaim(auctionId_);

        if (verification_ == VERIFY_RESULT.VERIFY) {
            DutchAuction.Auctions memory auction = dutchAuction.getAuction(auctionId_);
            assertTrue(auction.status == DutchAuction.AUCTION_STATUS.CLOSED);
            
            if (nftContracts[auctionId_] == NFT_CONTRACT.ERC721)
                assertEq(mockERC721.ownerOf(auction.tokenId), auction.tokenOwner);
            if (nftContracts[auctionId_] == NFT_CONTRACT.ERC721_UPGRADEABLE)
                assertEq(mockERC721Upgradeable.ownerOf(auction.tokenId), auction.tokenOwner);
        }
    }

    function help_calculatePrice(
        uint256 startPrice_,
        uint256 endPrice_,
        uint256 startDate_,
        uint256 endDate_
    ) internal view returns (uint256) {
        if(endPrice_ == 0) {
            return startPrice_ / (endDate_ - startDate_) * (endDate_ - block.timestamp);
        }
        return ((startPrice_ - endPrice_) / 
                (endDate_ - startDate_) * 
                (endDate_ - block.timestamp) +
                endPrice_);
    }

    function help_verify_getAuctionPrice(
        uint256 auctionId_,
        VERIFY_RESULT verification_
    ) public {
        DutchAuction.Auctions memory auction = dutchAuction.getAuction(auctionId_);
        require(block.timestamp == auction.startDate, "help_verify_getAuctionPrice require current timestamps to be equal to auction start date");
        uint256 currentTime = block.timestamp;
        while(currentTime <= auction.endDate) {
            vm.warp(currentTime);
            currentTime += (auction.endDate - auction.startDate) / LOOP_COUNT_PRICE_VERIFICATION;
            uint256 sellPrice = dutchAuction.getAuctionPrice(auctionId_);
            // console.log("timestamp, sellPrice", block.timestamp, sellPrice);

            if (verification_ == VERIFY_RESULT.VERIFY) {
                assertEq(sellPrice, help_calculatePrice(auction.startPrice, auction.endPrice, auction.startDate, auction.endDate));
            }
        }
    }
}