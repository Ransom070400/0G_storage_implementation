# 0G Storage App

A React TypeScript app for uploading files to the [0G decentralized storage network](https://0g.ai).

Built with **Vite + React 18 + TypeScript** using CSS Modules.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev
```

The app starts in **simulation mode** — uploads are faked with random Merkle root hashes so you can develop the UI without needing a blockchain connection.

---

## Integrating Real 0G Storage

### 1. Install the 0G SDK

```bash
npm install @0glabs/0g-storage-client ethers
```

### 2. Create a backend server

The upload must happen server-side (your private key stays on the server). Create a simple Express backend:

```bash
npm install express multer cors dotenv
npm install -D @types/express @types/multer @types/cors tsx
```

Create `server/index.ts`:

```ts
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { ethers } from 'ethers';
import { ZgFile, Indexer, getFlowContract } from '@0glabs/0g-storage-client';
import 'dotenv/config';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_ENDPOINT);
    const signer = new ethers.Wallet(process.env.ZG_PRIVATE_KEY!, provider);
    const flowContract = getFlowContract(process.env.ZG_FLOW_CONTRACT!, signer);
    const indexer = new Indexer(process.env.ZG_INDEXER_RPC!);

    const zgFile = await ZgFile.fromFilePath(req.file.path);
    const [tx, rootHash] = await indexer.upload(zgFile, 0, process.env.ZG_RPC_ENDPOINT!, flowContract);
    await zgFile.close();

    res.json({ rootHash, txHash: tx });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// Download endpoint
app.get('/api/download/:rootHash', async (req, res) => {
  try {
    const indexer = new Indexer(process.env.ZG_INDEXER_RPC!);
    const outputPath = `/tmp/${req.params.rootHash}`;
    await indexer.download(req.params.rootHash, outputPath, true);
    res.download(outputPath);
  } catch (err: any) {
    console.error('Download error:', err);
    res.status(500).json({ message: err.message || 'Download failed' });
  }
});

app.listen(4000, () => console.log('Server running on :4000'));
```

### 3. Environment variables

Create `.env` at the project root:

```env
# Get these from https://docs.0g.ai/build-with-0g/storage-sdk
ZG_RPC_ENDPOINT=https://evmrpc-testnet.0g.ai
ZG_INDEXER_RPC=https://indexer-storage-testnet.0g.ai
ZG_FLOW_CONTRACT=<flow_contract_address_from_docs>
ZG_PRIVATE_KEY=<your_wallet_private_key>
```

### 4. Connect the frontend

In `src/utils/api.ts`, flip the simulation flag:

```ts
const USE_SIMULATION = false; // ← change to false
```

And uncomment the real API call block below it.

### 5. Run both servers

```bash
# Terminal 1 — backend
npx tsx server/index.ts

# Terminal 2 — frontend (proxies /api to :4000)
npm run dev
```

The Vite config already proxies `/api/*` requests to `localhost:4000`.

### 6. Get testnet tokens

You'll need testnet 0G tokens to pay for storage gas fees:
- Faucet: https://faucet.0g.ai
- Network docs: https://docs.0g.ai

---

## Project Structure

```
0g-storage-app/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx                 # Entry point
    ├── App.tsx                  # Root component
    ├── App.module.css
    ├── components/
    │   ├── Header.tsx           # Logo + title
    │   ├── DropZone.tsx         # Drag & drop file input
    │   ├── FileCard.tsx         # Individual file row
    │   ├── Stats.tsx            # Upload stats bar
    │   └── Footer.tsx           # Testnet badge
    ├── hooks/
    │   └── useFileUpload.ts     # Upload state machine
    ├── types/
    │   └── index.ts             # TypeScript interfaces
    ├── utils/
    │   ├── api.ts               # 0G upload/download service
    │   └── format.ts            # Formatting helpers
    └── styles/
        └── global.css           # CSS variables + animations
```

## Key Concepts

- **Merkle Root Hash**: Every file uploaded to 0G gets a unique hash — this is the permanent file ID
- **Indexer**: Routes uploads/downloads to the right storage nodes
- **Flow Contract**: On-chain contract that tracks file submissions
- **Simulation Mode**: Toggle in `src/utils/api.ts` for local development without blockchain
