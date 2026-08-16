import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCasinoStore } from '../../state/casinoStore';
import { useUIStore } from '../../state/uiStore';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
// Se não tiveres o utils/validators, podes usar esta regex inline abaixo
// import { isValidSolanaAddress } from '../../utils/validators';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Validador simples de endereço Solana (Base58, 32-44 chars)
const isValidAddress = (addr: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);

export const WithdrawModal = ({ isOpen, onClose }: Props) => {
  // Inputs
  const [amount, setAmount] = useState<string>('');
  const [targetAddress, setTargetAddress] = useState('');
  
  // Validation States
  const [errorAmount, setErrorAmount] = useState<string | null>(null);
  const [errorAddress, setErrorAddress] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isUsdMode, setIsUsdMode] = useState(false); 

  const { publicKey: solanaKey } = useWallet();
  const { balance, setBalance, solPrice } = useCasinoStore(); 
  const { t } = useUIStore();

  // Reset states when opening/closing
  useEffect(() => {
    if (isOpen) {
        setAmount('');
        setTargetAddress('');
        setErrorAmount(null);
        setErrorAddress(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // CORREÇÃO: O 'balance' da store é SEMPRE em SOL.
  // Se estiver em modo USD, multiplicamos pelo preço para mostrar quantos dólares o user tem.
  const availableBalance = isUsdMode ? (balance * solPrice) : balance;
  const currencyLabel = isUsdMode ? 'USD' : 'SOL';

  // --- HANDLERS ---

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!/^\d*\.?\d*$/.test(val)) return;
    validateAndSetAmount(val);
  };

  const validateAndSetAmount = (val: string) => {
    setAmount(val);
    const numVal = parseFloat(val);
    
    // Pequena margem de erro para evitar problemas de float (0.000001)
    if (!val) {
        setErrorAmount(null);
    } else if (isNaN(numVal)) {
        setErrorAmount("Invalid number");
    } else if (numVal > availableBalance) {
        setErrorAmount("Insufficient funds");
    } else {
        setErrorAmount(null);
    }
  };

  const handleMaxClick = () => {
      // Arredonda para baixo para evitar enviar mais do que tem por causa de floats
      const safeMax = Math.floor(availableBalance * 10000) / 10000;
      validateAndSetAmount(safeMax.toString());
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Remove espaços
    val = val.trim();
    setTargetAddress(val);
    
    if (val.length > 0 && !isValidAddress(val)) {
        setErrorAddress("Invalid address format");
    } else {
        setErrorAddress(null);
    }
  };

  const handleWithdraw = async () => {
    if (!solanaKey) return toast.error(t('msg_error_connect'));
    if (errorAmount || errorAddress) return; 

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return toast.error("Invalid amount");
    if (val > availableBalance) return toast.error("Insufficient balance");

    const finalAddress = targetAddress || solanaKey.toString();
    
    if (!isValidAddress(finalAddress)) {
        setErrorAddress("Invalid Solana address");
        return;
    }

    // CORREÇÃO: Backend agora espera valor em SOL puro.
    // Se o user inseriu USD, convertemos para SOL antes de enviar.
    const amountInSol = isUsdMode ? (val / solPrice) : val;

    setLoading(true);
    const toastId = toast.loading("Requesting withdrawal...");

    try {
      const response = await api.post('wallet/withdraw', {
        walletAddress: finalAddress, // Se vazio no input, usa a carteira conectada? Não, deve ser explícito ou usar a conectada se null.
        amount: amountInSol,
        idempotencyKey: crypto.randomUUID()
      });

      if (response.success) {
        setBalance(response.newBalance);
        
        toast.success(`${t('msg_wit_success')} (-${amountInSol.toFixed(4)} SOL)`, { id: toastId });
        
        if (response.tx) {
            console.log("Payout TX:", response.tx);
            toast.success("Funds sent! Check wallet.", { duration: 5000 });
        }
        
        onClose();
      } else {
        toast.error(response.error || 'Withdrawal failed.', { id: toastId });
      }
    } catch (error: any) {
      console.error('Withdrawal Error:', error);
      const msg = error.response?.data?.error || "Server error";
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1a1f2b] p-8 rounded-3xl border border-red-500/20 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('modal_withdraw_title')}</h2>

        {/* INPUT DE VALOR */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
             <label className="text-xs text-gray-400 font-bold uppercase block">Amount</label>
             <button 
                onClick={() => { setIsUsdMode(!isUsdMode); setAmount(''); setErrorAmount(null); }}
                className="text-[10px] bg-[#0c0f17] border border-white/10 px-2 py-0.5 rounded text-red-400 font-bold hover:text-white transition-colors"
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
                className={`w-full bg-[#0c0f17] border rounded-xl pl-4 pr-28 py-4 text-white font-mono text-xl outline-none transition-all ${
                    errorAmount ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-red-500'
                }`}
                placeholder="0.00"
            />
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                    onClick={handleMaxClick}
                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-bold px-2 py-1 rounded transition-all border border-red-500/20"
                >
                    MAX
                </button>
                <span className="text-sm font-bold text-gray-500 select-none">
                    {currencyLabel}
                </span>
            </div>
          </div>

          <div className="flex justify-between items-start mt-2">
             <div className="text-xs text-red-500 font-bold h-4">
                {errorAmount && <span>⚠ {errorAmount}</span>}
             </div>
             <div className={`text-xs font-mono ${errorAmount ? 'text-red-400' : 'text-gray-500'}`}>
                Available: {isUsdMode ? '$' : ''}{availableBalance.toFixed(4)} {isUsdMode ? '' : 'SOL'}
             </div>
          </div>
        </div>

        {/* TARGET ADDRESS */}
        <div className="mb-6">
          <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">
            {t('lbl_target_address')} (Optional)
          </label>
          <input
            type="text"
            value={targetAddress}
            onChange={handleAddressChange}
            placeholder={solanaKey?.toString() || 'Your Wallet'}
            className={`w-full bg-[#0c0f17] border rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-gray-600 transition-colors ${
                errorAddress ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-red-500'
            }`}
          />
          {errorAddress && (
            <p className="text-red-500 text-xs mt-1 font-bold">⚠ {errorAddress}</p>
          )}
        </div>

        <button
          onClick={handleWithdraw}
          disabled={loading || !!errorAmount || !!errorAddress || !amount || parseFloat(amount) <= 0}
          className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'WITHDRAW NOW'}
        </button>
      </div>
    </div>
  );
};
