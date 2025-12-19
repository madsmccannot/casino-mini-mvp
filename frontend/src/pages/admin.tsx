import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

const AdminPage: NextPage = () => {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  
  // NOVO STATE: Controla visualmente os botões
  const [isEmergency, setIsEmergency] = useState<boolean>(false);

  // 1. Carregar Estado da Banca e Emergência
  const fetchStats = async () => {
    try {
      const data = await api.get('admin/bankroll');
      setStats(data);
      // Atualiza o estado dos botões com o que vem do backend
      setIsEmergency(data.isEmergency); 
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load admin data. Are you admin?");
      setTimeout(() => router.push('/'), 2000);
    }
  };

  useEffect(() => {
    if (connected) fetchStats();
  }, [connected]);

  // 2. Botão de Emergência
  const toggleEmergency = async (action: 'enable' | 'disable') => {
    // Se tentarmos ativar o que já está ativo, ignoramos (segurança extra frontend)
    if (action === 'enable' && isEmergency) return;
    if (action === 'disable' && !isEmergency) return;

    if (!confirm(`Are you sure you want to ${action.toUpperCase()} emergency mode?`)) return;
    
    try {
      const res = await api.post('admin/emergency/toggle', { action });
      toast.success(res.message);
      
      // Atualiza o estado local imediatamente para bloquear/desbloquear botões
      setIsEmergency(action === 'enable');
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Action failed");
    }
  };

  // 3. Levantar Lucros da Casa
  const handleHouseWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) return toast.error("Invalid input");

    setLoading(true);
    try {
      const res = await api.post('admin/bankroll/withdraw', {
        amount: parseFloat(withdrawAmount),
        targetAddress: withdrawAddress
      });
      
      if (res.success) {
        toast.success(`Withdrawn ${res.amount} SOL successfully!`);
        fetchStats(); 
        setWithdrawAmount('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Please connect your wallet to access Admin Panel.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl animate-fade-in text-white">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold border-l-4 border-red-500 pl-4">
          ADMIN DASHBOARD
        </h1>
        <button onClick={fetchStats} className="text-sm text-gray-400 hover:text-white">
          ↻ Refresh
        </button>
      </div>

      {/* SECÇÃO 1: BANCA DA CASA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1a1f2b] p-6 rounded-2xl border border-white/5">
          <div className="flex justify-between items-start">
             <h2 className="text-gray-400 text-xs font-bold uppercase mb-2">House Balance (Real)</h2>
             {/* Indicador de Status Visual */}
             <span className={`px-2 py-1 rounded text-[10px] font-bold ${isEmergency ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                {isEmergency ? 'SYSTEM HALTED' : 'OPERATIONAL'}
             </span>
          </div>
          <div className="text-4xl font-mono font-bold text-green-400">
            {stats ? stats.balanceSol.toFixed(4) : '...'} SOL
          </div>
          <div className="text-xs text-gray-600 mt-2 break-all">
            {stats?.address}
          </div>
        </div>

        <div className="bg-[#1a1f2b] p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
             <h2 className="text-gray-400 text-xs font-bold uppercase mb-4">Emergency Controls</h2>
             <div className="flex gap-4">
                 <button 
                    onClick={() => toggleEmergency('enable')}
                    disabled={isEmergency} // Desativa se já estiver em emergência
                    className={`flex-1 py-3 rounded-xl font-bold transition-all border 
                        ${isEmergency 
                            ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
                            : 'bg-red-600/20 hover:bg-red-600 border-red-600 text-red-500 hover:text-white'
                        }`}
                 >
                    STOP EVERYTHING 🛑
                 </button>
                 <button 
                    onClick={() => toggleEmergency('disable')}
                    disabled={!isEmergency} // Desativa se estiver tudo bem
                    className={`flex-1 py-3 rounded-xl font-bold transition-all border 
                        ${!isEmergency 
                            ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
                            : 'bg-green-600/20 hover:bg-green-600 border-green-600 text-green-500 hover:text-white'
                        }`}
                 >
                    RESUME OPERATIONS ▶
                 </button>
             </div>
        </div>
      </div>

      {/* SECÇÃO 2: LEVANTAR LUCROS */}
      <div className="bg-[#1a1f2b] p-8 rounded-2xl border border-white/5">
        <h2 className="text-xl font-bold mb-6">Withdraw House Profits</h2>
        
        <div className="grid gap-6">
            <div>
                <label className="text-xs text-gray-400 block mb-2">Target Address (Your Cold Wallet)</label>
                <input 
                    type="text" 
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full bg-[#0c0f17] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                    placeholder={publicKey?.toString()}
                />
            </div>

            <div>
                <label className="text-xs text-gray-400 block mb-2">Amount (SOL)</label>
                <input 
                    type="number" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#0c0f17] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="0.00"
                />
            </div>

            <button 
                onClick={handleHouseWithdraw}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"
            >
                {loading ? 'Processing...' : 'WITHDRAW FROM HOUSE'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;