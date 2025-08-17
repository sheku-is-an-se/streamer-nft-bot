// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StreamerNFT is ERC721, Ownable {
	uint256 public nextTokenId;

	// Stores tokenURI for each NFT
	mapping(uint256 => string) private _tokenURIs;

	// Event emitted when NFT metadata updates
	event MetadataUpdated(uint256 indexed tokenId, string newTokenURI);

	constructor() ERC721("Streamer Memory NFT", "SMNFT") Ownable(msg.sender) {}

	// Mint NFT to a fan
	function mint(address to, string memory initialTokenURI) external onlyOwner {
		uint256 tokenId = nextTokenId;
		_safeMint(to, tokenId);
		_tokenURIs[tokenId] = initialTokenURI;
		emit MetadataUpdated(tokenId, initialTokenURI);
		nextTokenId++;
	}

	// Update NFT metadata (e.g., when a milestone is reached)
	function updateTokenURI(uint256 tokenId, string memory newTokenURI) external onlyOwner {
		_requireOwned(tokenId);
		_tokenURIs[tokenId] = newTokenURI;
		emit MetadataUpdated(tokenId, newTokenURI);
	}

	// Override tokenURI to return custom value
	function tokenURI(uint256 tokenId) public view override returns (string memory) {
		_requireOwned(tokenId);
		return _tokenURIs[tokenId];
	}
}

//
