// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITokenBoundAccountRegistry {
	function createAccount(
		address implementation,
		uint256 chainId,
		address tokenContract,
		uint256 tokenId,
		uint256 salt,
		bytes calldata initData
	) external payable returns (address);

	function account(
		address implementation,
		uint256 chainId,
		address tokenContract,
		uint256 tokenId,
		uint256 salt
	) external view returns (address);
}


