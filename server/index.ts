import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { ethers } from 'ethers';
import { ZgFile, Indexer, Batcher, KvClient } from '@0glabs/0g-ts-sdk';
import 'dotenv/config';

// ── Environment validation ──────────────────────────────────────────
const REQUIRED = ['ZG_EVM_RPC', 'ZG_INDEXER_RPC', 'ZG_PRIVATE_KEY'] as const;
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`❌ Missing: ${key}`);
    process.exit(1);
  }
}

// ── Blockchain setup ────────────────────────────────────────────────
let privateKey = process.env.ZG_PRIVATE_KEY!.trim();
if (!privateKey.startsWith('0x')) privateKey = `0x${privateKey}`;

const provider = new ethers.JsonRpcProvider(process.env.ZG_EVM_RPC);
const signer = new ethers.Wallet(privateKey, provider);
const indexer = new Indexer(process.env.ZG_INDEXER_RPC!);

// ── Express setup ───────────────────────────────────────────────────
const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

// ── Upload endpoint ─────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), async (req, res) => {
  let zgFile: ZgFile | null = null;

  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    // Create file object from uploaded file path
    zgFile = await ZgFile.fromFilePath(req.file.path);

    // Generate Merkle tree for verification
    const [tree, hashErr] = await zgFile.merkleTree();
    if (hashErr) throw new Error(`Merkle tree generation failed: ${hashErr}`);

    const rootHash = tree!.rootHash();
    console.log(`File Root Hash: ${rootHash}`);

    // Upload to 0G network
    const [tx, uploadErr] = await indexer.upload(
      zgFile,
      process.env.ZG_EVM_RPC!,
      signer as any
    );

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr}`);

    console.log(`✓ Uploaded | root: ${rootHash} | tx: ${tx}`);
    res.json({ rootHash, txHash: tx });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  } finally {
    // Always close the file when done
    if (zgFile) await zgFile.close();
  }
});

// ── Download endpoint ───────────────────────────────────────────────
app.get('/api/download/:rootHash', async (req, res) => {
  try {
    const outputPath = `/tmp/0g-${req.params.rootHash}`;
    const err = await indexer.download(req.params.rootHash, outputPath, true);
    if (err) throw new Error(`Download failed: ${err}`);
    res.download(outputPath);
  } catch (err: any) {
    console.error('Download error:', err);
    res.status(500).json({ message: err.message || 'Download failed' });
  }
});

// ── Start server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`0G Storage server on :${PORT}`);
  console.log(`RPC: ${process.env.ZG_EVM_RPC}`);
  console.log(`Signer: ${signer.address}`);
});