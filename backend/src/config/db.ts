import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Definir strictQuery para evitar warnings em versões recentes do Mongoose
    mongoose.set('strictQuery', false);

    const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/solcasino';
    
    // Opções de conexão para maior estabilidade em produção
    const conn = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout se não encontrar a BD em 5s
        socketTimeoutMS: 45000, // Fechar conexões inativas
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error: any) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};
