import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useCasinoStore } from '../../state/casinoStore';
import { useUIStore } from '../../state/uiStore';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal = ({ isOpen, onClose }: Props) => {
  const { connection } = useConnection();
  const { publicKey: solanaKey, sendTransaction } = useWallet();
  const { setBalance, solPrice } = useCasinoStore(); 
  const { t } = useUIStore();

  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [casinoAddress, setCasinoAddress] = useState<string | null>(null);
  const [isUsdMode, setIsUsdMode] = useState(false);

  // Buscar endereço do Casino
  useEffect(() => {
    const fetchCasinoKey = async () => {
      try {
        const response = await api.get('casino/publicKey');
        const address = typeof response === 'object' ? response.SOL || response.publicKey : response;
        setCasinoAddress(address);
      } catch (error) {
        toast.error('Failed to load Casino address.');
      }
    };
    if (isOpen) fetchCasinoKey();
  }, [isOpen]);

  if (!isOpen) return null;

  // STRICT INPUT HANDLER
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only numbers and one dot
    if (/^\d*\.?\d*$/.test(val)) {
        setAmount(val);
    }
  };

  const getSolAmount = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return 0;
    if (!isUsdMode) return val;
    if (solPrice <= 0) return 0;
    return val / solPrice;
  };

  const handleSolanaDeposit = async () => {
    const solAmount = getSolAmount();

    if (!solanaKey || !casinoAddress) return toast.error(t('msg_error_connect'));
    if (solAmount < 0.01) return toast.error("Min deposit is 0.01 SOL");

    setLoading(true);
    const toastId = toast.loading("Processing deposit...");

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: solanaKey,
          toPubkey: new PublicKey(casinoAddress),
          lamports: Math.floor(solAmount * LAMPORTS_PER_SOL),
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = solanaKey;

      const signature = await sendTransaction(transaction, connection);
      
      toast.loading("Confirming on chain...", { id: toastId });
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      
      await new Promise(r => setTimeout(r, 2000));

      toast.loading("Verifying...", { id: toastId });
      const response = await api.post('wallet/deposit', {
        walletAddress: solanaKey.toString(),
        signature,
        chain: 'SOL',
      });

      if (response.success) {
        setBalance(response.newBalance);
        toast.success(`Success! +${solAmount.toFixed(4)} SOL`, { id: toastId });
        onClose();
        setAmount('');
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Deposit failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1a1f2b] p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('modal_deposit_title')}</h2>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
             <label className="text-xs text-gray-400 font-bold uppercase block">Amount</label>
             <button 
                onClick={() => { setIsUsdMode(!isUsdMode); setAmount(''); }}
                className="text-[10px] bg-[#0c0f17] border border-white/10 px-2 py-0.5 rounded text-blue-400 font-bold hover:text-white transition-colors"
             >
                SWITCH TO {isUsdMode ? 'SOL' : 'USD'}
             </button>
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full bg-[#0c0f17] border border-white/10 rounded-xl pl-4 pr-16 py-4 text-white font-mono text-xl focus:border-blue-500 outline-none transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 select-none">
                {isUsdMode ? 'USD' : 'SOL'}
            </span>
          </div>
          
          {amount && parseFloat(amount) > 0 && (
              <div className="text-right text-xs text-gray-500 mt-2 font-mono">
                  ≈ {isUsdMode 
                      ? `${(parseFloat(amount) / solPrice).toFixed(4)} SOL` 
                      : `$${(parseFloat(amount) * solPrice).toFixed(2)}`
                    }
              </div>
          )}
        </div>

        <button
          onClick={handleSolanaDeposit}
          disabled={loading || !casinoAddress || !amount || parseFloat(amount) <= 0}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'DEPOSIT NOW'}
        </button>
      </div>
    </div>
  );
};