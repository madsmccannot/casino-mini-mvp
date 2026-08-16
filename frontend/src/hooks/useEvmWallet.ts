import { useAccount, useChainId, useDisconnect, useSignMessage } from 'wagmi';

export function useEvmWallet() {
  const account = useAccount();
  const chainId = useChainId();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  return {
    address: account.address ?? null,
    connected: account.isConnected,
    isConnecting: account.isConnecting,
    isReconnecting: account.isReconnecting,
    chainId,
    isSigning,
    signMessage: (message: string) => signMessageAsync({ message }),
    disconnect: disconnectAsync,
  };
}
