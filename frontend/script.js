// Minimal frontend for MemoryNFTs (StreamerNFT)
// Uses ethers v6 and WebSocket live updates

(function () {
  const CONTRACT_ADDRESS = "0x33253FBDd9bc3695593feA2A8f24c0A3Adae75b1"; // demo deployed address
  const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111
  const ABI_URLS = ["./StreamerNFT.json"]; // single source of truth

  const el = {
    btnConnect: document.getElementById("btnConnect"),
    connStatus: document.getElementById("connStatus"),
    btnRefresh: document.getElementById("btnRefresh"),
    totalSupply: document.getElementById("totalSupply"),
    yourAddress: document.getElementById("yourAddress"),
    nftGrid: document.getElementById("nftGrid"),
    mintTo: document.getElementById("mintTo"),
    mintUri: document.getElementById("mintUri"),
    btnMint: document.getElementById("btnMint"),
    mintStatus: document.getElementById("mintStatus"),
    memoryLog: document.getElementById("MemoryLog"),
  };

  let provider = null;
  let signer = null;
  let account = null;
  let contract = null;
  let abi = null;

  async function loadAbi() {
    for (const url of ABI_URLS) {
      try {
        const artifact = await fetch(url).then(r => r.ok ? r.json() : null);
        if (!artifact) continue;
        abi = Array.isArray(artifact) ? artifact : (artifact.abi || artifact);
        if (Array.isArray(abi)) return;
      } catch (_) {}
    }
    throw new Error("StreamerNFT ABI not found");
  }

  async function ensureSepolia() {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    }
  }

  async function connect() {
    if (!window.ethereum) {
      el.connStatus.textContent = "MetaMask not found. Install it first.";
      return;
    }

    try {
      await loadAbi();
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await ensureSepolia();

      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      account = await signer.getAddress();
      let deployedAddress = CONTRACT_ADDRESS;
      try {
        const artifact = await fetch("./StreamerNFT.json").then(r => r.json());
        if (artifact?.address) deployedAddress = artifact.address;
      } catch (_) {}
      contract = new ethers.Contract(deployedAddress, abi, signer);

      el.connStatus.textContent = "Connected";
      el.yourAddress.textContent = account;
      el.mintTo.value = account;

      await refreshData();
      initWebSocket();
    } catch (err) {
      console.error(err);
      el.connStatus.textContent = "Connection failed: " + (err?.message || err);
    }
  }

  async function refreshData() {
    if (!contract) return;

    try {
      const next = await contract.nextTokenId();
      const total = Number(next);
      el.totalSupply.textContent = String(total);

      el.nftGrid.innerHTML = "";
      if (!account) return;

      for (let i = 0; i < total; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            let uri = "";
            try { uri = await contract.tokenURI(i); } catch (_) { uri = ""; }
            const imgUrl = await resolveImageUrlFromTokenUri(uri);
            const card = createNftCard(i, uri, imgUrl);
            el.nftGrid.appendChild(card);
          }
        } catch (_) { /* skip non-existent */ }
      }
    } catch (err) {
      console.error("refreshData error", err);
    }
  }

  async function mint() {
    el.mintStatus.textContent = "";
    if (!contract || !signer) {
      el.mintStatus.textContent = "Connect wallet first.";
      return;
    }
    const to = el.mintTo.value.trim();
    const uri = el.mintUri.value.trim();
    if (!to || !to.startsWith("0x")) {
      el.mintStatus.textContent = "Invalid recipient address.";
      return;
    }
    if (!uri) {
      el.mintStatus.textContent = "Metadata URI is required.";
      return;
    }
    try {
      const tx = await contract.mint(to, uri);
      el.mintStatus.textContent = "Mint tx submitted: " + tx.hash + "\nWaiting for confirmation...";
      await tx.wait();
      el.mintStatus.textContent = "Minted successfully. Tx: " + tx.hash;
      await refreshData();
    } catch (err) {
      console.error(err);
      el.mintStatus.textContent = "Mint failed: " + (err?.shortMessage || err?.message || err);
    }
  }

  function initWebSocket() {
    try {
      const wsUrl = (window.MEMORYNFT_WS_URL || "ws://localhost:4000");
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => logMemory("WebSocket connected: " + wsUrl);
      ws.onclose = () => logMemory("WebSocket disconnected");
      ws.onerror = (e) => logMemory("WebSocket error: " + (e?.message || e));

      ws.onmessage = async (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data?.type === "memoryUpdate") {
            const msg = (data?.message || "(memoryUpdate)");
            logMemory(msg);
            if (/Minted token/i.test(msg) || /Metadata updated/i.test(msg)) {
              await refreshData();
            }
          } else {
            logMemory(evt.data);
          }
        } catch (_) {
          logMemory(evt.data);
        }
      };
    } catch (err) {
      console.error("WebSocket init failed", err);
      logMemory("WebSocket init failed: " + (err?.message || err));
    }
  }

  function logMemory(msg) {
    if (!el.memoryLog) return;
    const line = document.createElement("div");
    const t = new Date().toLocaleTimeString();
    line.className = "line";
    line.textContent = `[${t}] ${msg}`;
    el.memoryLog.prepend(line);
  }

  function toHttpUrl(uri) {
    if (!uri) return "";
    if (uri.startsWith("ipfs://")) {
      return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    return uri;
  }

  async function resolveImageUrlFromTokenUri(tokenUri) {
    const url = toHttpUrl(tokenUri);
    if (!url) return "";
    if (/[.](png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url)) return url;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) return "";
      const meta = await res.json();
      const img = meta.image || meta.image_url || meta.imageURI || "";
      return toHttpUrl(img);
    } catch (_) {
      return "";
    }
  }

  function createNftCard(tokenId, uri, imgUrl) {
    const card = document.createElement("div");
    card.className = "nft-card";

    const title = document.createElement("h4");
    title.textContent = `Token #${tokenId}`;
    card.appendChild(title);

    const img = document.createElement("img");
    img.alt = `Token #${tokenId}`;
    img.width = 200; img.height = 200;
    if (imgUrl) img.src = imgUrl;
    card.appendChild(img);

    const uriEl = document.createElement("div");
    uriEl.className = "uri";
    uriEl.textContent = uri || "(no tokenURI)";
    card.appendChild(uriEl);

    // Simulate Memory Update controls
    const controls = document.createElement("div");
    controls.className = "controls";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "ipfs://CID for new metadata";
    controls.appendChild(input);

    const btn = document.createElement("button");
    btn.className = "secondary";
    btn.textContent = "Simulate Memory Update";
    btn.addEventListener("click", async () => {
      const newUri = input.value.trim();
      if (!newUri) { logMemory(`Provide a URI for token #${tokenId}`); return; }
      try {
        const tx = await contract.updateTokenURI(tokenId, newUri);
        logMemory(`Simulate: updating token #${tokenId} → ${newUri} (tx: ${tx.hash})`);
        await tx.wait();
        img.src = await resolveImageUrlFromTokenUri(newUri);
        uriEl.textContent = newUri;
      } catch (err) {
        logMemory(`Update failed for token #${tokenId}: ${err?.shortMessage || err?.message || err}`);
      }
    });
    controls.appendChild(btn);

    card.appendChild(controls);
    return card;
  }

  el.btnConnect.addEventListener("click", connect);
  el.btnRefresh.addEventListener("click", refreshData);
  el.btnMint.addEventListener("click", mint);
})();
