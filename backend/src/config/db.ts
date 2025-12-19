import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // CORREÇÃO: Adicionada uma URI local de fallback para garantir que o servidor arranca 
    // mesmo que o .env não esteja configurado.
    const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/solcasino';
    
    const conn = await mongoose.connect(MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};