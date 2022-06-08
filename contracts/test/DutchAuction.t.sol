// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @title DutchAuction - Test
 */

import "./utils/console.sol";
import { SetupTest } from "./SetupTest.t.sol";

contract DutchAuctionTest is SetupTest {

    function setUp() public {
        deployAndInitializeAllContracts();
    }

    function test_createAuction() public {
        address seller = address(1);
        address tokenContract = address(mockERC721);
        uint256 tokenId = 1;
        uint256 startDate = block.timestamp;
        uint256 startPrice = 10 ether;
        uint256 endDate = block.timestamp + 1_000_000;
        uint256 endPrice = 1 ether;

        help_createAuction(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate,
            endPrice,
            NFT_CONTRACT.ERC721,
            VERIFY_RESULT.VERIFY,
            MINT_FOR_TEST.MINT
        );
    }

    function test_bid() public {
        address seller = address(1);
        address tokenContract = address(mockERC721);
        uint256 tokenId = 1;
        uint256 startDate = block.timestamp;
        uint256 startPrice = 10 ether;
        uint256 endDate = block.timestamp + 1_000_000;
        uint256 endPrice = 1 ether;
        address buyer = address(2);

        help_createAuction(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate,
            endPrice,
            NFT_CONTRACT.ERC721,
            VERIFY_RESULT.VERIFY,
            MINT_FOR_TEST.MINT
        );
        vm.warp(block.timestamp + 10);
        vm.roll(block.number + 1);

        uint256 auctionId = dutchAuction.getAuctionId(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate
        );

        help_bid(
            buyer,
            auctionId,
            VERIFY_RESULT.VERIFY,
            MINT_FOR_TEST.MINT
        );
    }

    function test_reclaim() public {
        address seller = address(1);
        address tokenContract = address(mockERC721);
        uint256 tokenId = 1;
        uint256 startDate = block.timestamp;
        uint256 startPrice = 10 ether;
        uint256 endDate = block.timestamp + 1_000_000;
        uint256 endPrice = 1 ether;

        help_createAuction(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate,
            endPrice,
            NFT_CONTRACT.ERC721,
            VERIFY_RESULT.VERIFY,
            MINT_FOR_TEST.MINT
        );
        vm.warp(endDate + 10);
        vm.roll(block.number + 100);

        uint256 auctionId = dutchAuction.getAuctionId(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate
        );

        help_reclaim(
            seller,
            auctionId,
            VERIFY_RESULT.VERIFY
        );
    }

    function test_getAuctionPrice() public {
        address seller = address(1);
        address tokenContract = address(mockERC721);
        uint256 tokenId = 1;
        uint256 startDate = block.timestamp;
        uint256 startPrice = 11 ether;
        uint256 endDate = block.timestamp + 100;
        uint256 endPrice = 1 ether;

        help_createAuction(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate,
            endPrice,
            NFT_CONTRACT.ERC721,
            VERIFY_RESULT.VERIFY,
            MINT_FOR_TEST.MINT
        );

        uint256 auctionId = dutchAuction.getAuctionId(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate
        );

        help_verify_getAuctionPrice(auctionId, VERIFY_RESULT.VERIFY);
    }

    function test_getAuctionPrice_prime_priceDifference() public {
        address seller = address(1);
        address tokenContract = address(mockERC721);
        uint256 tokenId = 1;
        uint256 startDate = block.timestamp;
        uint256 startPrice = 11 ether;
        uint256 endDate = block.timestamp + 100;
        uint256 endPrice = 4 ether;

        help_createAuction(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate,
            endPrice,
            NFT_CONTRACT.ERC721,
            VERIFY_RESULT.VERIFY,
            MINT_FOR_TEST.MINT
        );

        uint256 auctionId = dutchAuction.getAuctionId(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate
        );

        help_verify_getAuctionPrice(auctionId, VERIFY_RESULT.VERIFY);
    }

    function test_getAuctionPrice_zero_endPrice() public {
        address seller = address(1);
        address tokenContract = address(mockERC721);
        uint256 tokenId = 1;
        uint256 startDate = block.timestamp;
        uint256 startPrice = 100;
        uint256 endDate = block.timestamp + 100;
        uint256 endPrice = 0;
        
        help_createAuction(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate,
            endPrice,
            NFT_CONTRACT.ERC721,
            VERIFY_RESULT.VERIFY,
            MINT_FOR_TEST.MINT
        );

        uint256 auctionId = dutchAuction.getAuctionId(
            seller,
            tokenContract,
            tokenId,
            startDate,
            startPrice,
            endDate
        );

        help_verify_getAuctionPrice(auctionId, VERIFY_RESULT.VERIFY);
    }
}