import mongoose from 'mongoose';

// Definimos as regras para um Jogador
const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  totalWagered: {
    type: Number,
    default: 0,
  },
  // CAMPO: Identifica a conta que representa o saldo total da casa
  isBankroll: {
    type: Boolean,
    default: false,
  },
  // NOVO CAMPO: Identifica o utilizador administrador
  isAdmin: {
    type: Boolean,
    default: false,
  },
  // NOVO CAMPO: Estado global de emergência
  isTransferEnabled: {
    type: Boolean,
    default: true, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model('User', userSchema);