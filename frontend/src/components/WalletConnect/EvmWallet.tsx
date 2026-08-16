import { ConnectButton } from '@rainbow-me/rainbowkit';

export function EvmWallet() {
  return (
    <div className="wallet-control">
      <ConnectButton.Custom>
        {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
          if (!mounted) {
            return <button type="button" className="connect-button" disabled>Connect wallet</button>;
          }
          if (!account || !chain) {
            return <button type="button" className="connect-button" onClick={openConnectModal}>Connect wallet</button>;
          }
          if (chain.unsupported) {
            return <button type="button" className="connect-button wallet-error" onClick={openChainModal}>Switch network</button>;
          }
          return (
            <button type="button" className="connect-button" onClick={openAccountModal} title={`${chain.name} · ${account.address}`}>
              {account.displayName}
            </button>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
