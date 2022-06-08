//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DutchAuction
 */

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';

contract DutchAuction is AccessControlUpgradeable {

    enum AUCTION_STATUS {
        NOT_ASSIGNED,
        STARTED,
        SOLD,
        CLOSED
    }

    enum TOKEN_TYPE {
        ERC721
    }

    struct Auctions {
        AUCTION_STATUS status;
        TOKEN_TYPE nftType;
        address tokenOwner;
        address tokenContract;
        uint256 tokenId;
        uint256 startDate;
        uint256 startPrice;
        uint256 endDate;
        uint256 endPrice;
    }

    IERC20Upgradeable token;
    mapping(uint256 => Auctions) auctions;
    mapping(address => bool) validNfts;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed tokenContract,
        uint256 tokenId,
        uint256 startDate,
        uint256 startPrice,
        uint256 endDate,
        uint256 endPrice
    );

    event AuctionClosed(
        uint256 indexed auctionId,
        address indexed buyer,
        uint256 finalPrice
    );

    function initialize(
        IERC20Upgradeable tokenContract_
    ) external initializer {
        token = tokenContract_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createAuction(
        TOKEN_TYPE type_,
        address nftContract_,
        uint256 tokenId_,
        uint256 startDate_,
        uint256 startPrice_,
        uint256 endDate_,
        uint256 endPrice_
    ) external {
        require(startDate_ >= block.timestamp, "DutchAuction: Start date must be in the future");
        require(endDate_ > startDate_, "DutchAuction: End date must be after start date");
        require(endPrice_ < startPrice_, "DutchAuction: End price must be smaller than start price or 0");
        require(validNfts[nftContract_], "DutchAuction: Token contract is not valid");

        uint256 auctionId = getAuctionId(msg.sender, nftContract_, tokenId_, startDate_, startPrice_, endDate_);
        require(auctions[auctionId].status == AUCTION_STATUS.NOT_ASSIGNED, "Auction already exists");

        auctions[auctionId] = Auctions(
            AUCTION_STATUS.STARTED,
            type_,
            msg.sender,
            nftContract_,
            tokenId_,
            startDate_,
            startPrice_,
            endDate_,
            endPrice_
        );
        emit AuctionCreated(auctionId, msg.sender, nftContract_, tokenId_, startDate_, startPrice_, endDate_, endPrice_);
        IERC721Upgradeable(nftContract_).transferFrom(msg.sender, address(this), tokenId_);
    }

    function bid(uint256 auctionId_) external {
        uint256 bidPrice = getAuctionPrice(auctionId_);
        require(bidPrice > 0, "DutchAuction: Auction id not valid or already finished");
        auctions[auctionId_].status = AUCTION_STATUS.SOLD;

        require(token.transferFrom(msg.sender, auctions[auctionId_].tokenOwner, bidPrice), "DutchAuction: Failed to transfer token");
        emit AuctionClosed(auctionId_, msg.sender, bidPrice);

        IERC721Upgradeable(auctions[auctionId_].tokenContract).transferFrom(address(this), msg.sender, auctions[auctionId_].tokenId);
    }

    function reclaim(uint256 auctionId_) external {
        require(auctions[auctionId_].status == AUCTION_STATUS.STARTED, "DutchAuction: Auction id not valid or already finished");
        require(auctions[auctionId_].endDate < block.timestamp, "DutchAuction: Auction is not finished");
        auctions[auctionId_].status = AUCTION_STATUS.CLOSED;

        emit AuctionClosed(auctionId_, auctions[auctionId_].tokenOwner, 0);

        IERC721Upgradeable(auctions[auctionId_].tokenContract).transferFrom(address(this), msg.sender, auctions[auctionId_].tokenId);
    }

    function getAuctionPrice(uint256 auctionId_) public view returns (uint256) {
        Auctions memory auction = auctions[auctionId_];
        require(auction.status == AUCTION_STATUS.STARTED, "DutchAuction: Auction id not valid or already finished");
        require(auction.endDate >= block.timestamp, "DutchAuction: Auction has already finished");

        if(block.timestamp <= auction.startDate)
            return auction.startPrice;
        return ((auction.startPrice - auction.endPrice) / 
                (auction.endDate - auction.startDate) * 
                (auction.endDate - block.timestamp) +
                auction.endPrice);
    }

    function getAuctionId(
        address owner_,
        address tokenContract_,
        uint256 tokenId_,
        uint256 startDate_,
        uint256 startPrice_,
        uint256 endDate_
    ) public pure returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    owner_,
                    tokenContract_,
                    tokenId_,
                    startDate_,
                    startPrice_,
                    endDate_
                )
            )
        );
    }

    function getAuction(uint256 auctionId_) public view returns (Auctions memory) {
        return auctions[auctionId_];
    }

    function verifyNftIsValid(address tokenContract_) public view returns (bool isValid) {
        return validNfts[tokenContract_];
    }

    function setToken(
        IERC20Upgradeable tokenContract_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        token = tokenContract_;
    }

    function setNftContract(
        address nftContract_,
        bool isAccepted_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        validNfts[nftContract_] = isAccepted_;
    }
}
