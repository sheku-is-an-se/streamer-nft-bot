// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A minimal token-bound account implementation for demo purposes.
// In production, consider using a battle-tested implementation (e.g., reference ERC-6551 account).

contract MinimalTBA {
	address public owner;

	constructor(address _owner) {
		owner = _owner;
	}

	receive() external payable {}

	function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory) {
		require(msg.sender == owner, "Not owner");
		(bool ok, bytes memory res) = to.call{value: value}(data);
		require(ok, "call failed");
		return res;
	}
}


