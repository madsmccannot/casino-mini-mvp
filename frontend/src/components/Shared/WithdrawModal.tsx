interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawModal = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1f2b] p-8 rounded-3xl border border-amber-500/20 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Withdrawals unavailable</h2>
        <p className="text-sm text-gray-400 text-center">Production custody is disabled until a reviewed provider, reconciliation process and release approval exist.</p>
      </div>
    </div>
  );
};
