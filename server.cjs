// Simple WebSocket broadcaster for MemoryNFTs (StreamerNFT)
// Emits { type: "memoryUpdate", message: "..." } on mint and metadata updates

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const { ethers } = require("ethers");

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 4000;
const FRONTEND_ARTIFACT_PATH = path.join(__dirname, "frontend", "StreamerNFT.json");

function loadFrontendArtifact() {
	const raw = fs.readFileSync(FRONTEND_ARTIFACT_PATH, "utf8");
	const json = JSON.parse(raw);
	if (!json || !json.abi || !json.address) {
		throw new Error("frontend/StreamerNFT.json must include { abi, address }");
	}
	return json;
}

async function main() {
	const { abi, address } = loadFrontendArtifact();
	if (!process.env.SEPOLIA_RPC_URL) {
		throw new Error("Missing SEPOLIA_RPC_URL in .env");
	}

	const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
	const contract = new ethers.Contract(address, abi, provider);

	const wss = new WebSocketServer({ port: PORT });
	wss.on("connection", (ws) => {
		try {
			ws.send(JSON.stringify({ type: "memoryUpdate", message: "WebSocket connected" }));
		} catch (_) {}
	});

	function broadcast(obj) {
		const data = JSON.stringify(obj);
		for (const client of wss.clients) {
			if (client.readyState === 1) {
				try { client.send(data); } catch (_) {}
			}
		}
	}

	// Mint detection: ERC721 Transfer from zero address
	contract.on("Transfer", (from, to, tokenId) => {
		if (from === ethers.constants.AddressZero) {
			broadcast({ type: "memoryUpdate", message: `Minted token #${tokenId.toString()} to ${to}` });
		}
	});

	// Metadata updates (custom event)
	contract.on("MetadataUpdated", (tokenId, newTokenURI) => {
		broadcast({ type: "memoryUpdate", message: `Updated token #${tokenId.toString()} URI → ${newTokenURI}` });
	});

	console.log(`MemoryNFTs WebSocket listening on ws://localhost:${PORT}`);
	console.log(`Watching contract ${address} on Sepolia`);

	process.on("SIGINT", () => {
		console.log("Shutting down...");
		contract.removeAllListeners();
		wss.close(() => process.exit(0));
	});
}

main().catch((err) => {
	console.error("Server error:", err);
	process.exit(1);
});
