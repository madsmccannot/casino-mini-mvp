# Crypto Casino Platform (Solana + EVM) — Proof of Concept

Este projeto é um **casino Web3 híbrido**, compatível com **Solana** e **EVM**, com três jogos implementados:

- Coinflip  
- Dice  
- Roulette  

Inclui:

- Bankroll Manager com limites dinâmicos  
- Emergency Shutdown System  
- Suporte para testnet e preparação para mainnet  
- RNG híbrido: Switchboard (Solana) + Chainlink VRF (EVM) + fallback Commit-Reveal  
- Infraestrutura simplificada com Docker

---

## 🔧 Tecnologias

### Frontend
- Next.js + React  
- Zustand para state management  
- Conectores: Phantom, Solflare, MetaMask, Coinbase Wallet

### Backend
- Node.js + TypeScript  
- Express  
- Solana Web3 SDK  
- ethers.js  
- Switchboard RNG  
- Chainlink VRF  
- Bankroll + Risk Engine internos

### Smart Contracts
- Solana (Anchor)  
- EVM (Solidity + Hardhat)

### Infra
- Docker + docker-compose

---

## 📂 Estrutura
(A árvore completa está na tua mensagem anterior)

---

## 🚀 Como correr o PoC

### 1. Criar `.env`
Copia o ficheiro `.env.example` para `.env`:

🧪 Testnets suportadas
Solana:

devnet

testnet

mainnet-beta (opcional, não recomendado para PoC)

EVM:

Polygon Amoy

Base Sepolia

Ethereum Sepolia

```bash
cp .env.example .env
