import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { ethers } from 'ethers';
import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';
import 'dotenv/config';

const REQUIRED = ['ZG_EVM_RPC', 'ZG_INDEXER_RPC', 'ZG_PRIVATE_KEY'] as const;
for (const key of REQUIRED) {
  if (!process.env[key]) { console.error(`❌ Missing: ${key}`); process.exit(1); }
}

let privateKey = process.env.ZG_PRIVATE_KEY!.trim();
if (!privateKey.startsWith('0x')) privateKey = `0x${privateKey}`;

const provider = new ethers.JsonRpcProvider(process.env.ZG_EVM_RPC);
const signer = new ethers.Wallet(privateKey, provider);
const indexer = new Indexer(process.env.ZG_INDEXER_RPC!);

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const zgFile = await ZgFile.fromFilePath(req.file.path);

    const [tree, hashErr] = await zgFile.merkleTree();
    if (hashErr) throw new Error(`Hash failed: ${hashErr}`);
    const rootHash = tree!.rootHash();

    const [tx, uploadErr] = await indexer.upload(
      zgFile,
      process.env.ZG_EVM_RPC!,
      signer as any
    );

    await zgFile.close();

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr}`);

    console.log(`✓ Uploaded | root: ${rootHash} | tx: ${tx}`);
    res.json({ rootHash, txHash: tx });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`0G Storage server on :${PORT}`);
  console.log(`RPC: ${process.env.ZG_EVM_RPC}`);
  console.log(`Signer: ${signer.address}`);
});