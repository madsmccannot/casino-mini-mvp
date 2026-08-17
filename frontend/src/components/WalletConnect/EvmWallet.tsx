import { ConnectButton } from '@rainbow-me/rainbowkit';

export function EvmWallet() {
  return (
    <div data-no-translate className="wallet-control w-full">
      <ConnectButton.Custom>
        {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
          if (!mounted) {
            return <button type="button" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-blue-400/30 bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-950/30" disabled><span className="h-2 w-2 animate-pulse rounded-full bg-blue-200" />Connect wallet</button>;
          }
          if (!account || !chain) {
            return <button type="button" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-blue-300/40 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-300/60" onClick={openConnectModal}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">◎</span>Connect wallet</button>;
          }
          if (chain.unsupported) {
            return <button type="button" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-amber-500/15 px-5 text-sm font-extrabold text-amber-200 transition hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-300/60" onClick={openChainModal}>Switch network <span>↗</span></button>;
          }
          return (
            <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 text-sm font-extrabold text-white transition hover:border-emerald-300/60 hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-300/60" onClick={openAccountModal} title={`${chain.name} · ${account.address}`}>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />{account.displayName}</span><span className="text-xs text-emerald-200">{chain.name}</span>
            </button>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
