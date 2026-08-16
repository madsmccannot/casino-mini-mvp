import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { reconcileLedger } from '../ledger/reconciliation.service';

dotenv.config();

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required');
  await mongoose.connect(uri);
  try {
    const report = await reconcileLedger();
    console.log(JSON.stringify(report, null, 2));
    if (!report.healthy) process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
