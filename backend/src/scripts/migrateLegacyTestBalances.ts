import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { migrateLegacyTestBalances } from '../ledger/migrateLegacyBalances.service';

dotenv.config();

const run = async () => {
  if (process.env.CONFIRM_TEST_BALANCE_MIGRATION !== 'yes') {
    throw new Error('Set CONFIRM_TEST_BALANCE_MIGRATION=yes to confirm that all legacy balances are test data');
  }
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required');
  await mongoose.connect(uri);
  try {
    const report = await migrateLegacyTestBalances();
    console.log(JSON.stringify(report, null, 2));
    if (report.errors.length) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
