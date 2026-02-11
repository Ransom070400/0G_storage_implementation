import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type FC,
  type ReactNode,
} from 'react';

/* ─── 0G Network Definitions ─── */

export interface NetworkConfig {
  chainId: number;
  hexChainId: string;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
}

export const OG_NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    chainId: 16661,
    hexChainId: '0x4115',
    name: '0G Mainnet',
    shortName: 'Mainnet',
    rpcUrl: 'https://evmrpc.0g.ai',
    explorerUrl: 'https://chainscan.0g.ai',
    nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  },
  testnet: {
    chainId: 16602,
    hexChainId: '0x40da',
    name: '0G Galileo Testnet',
    shortName: 'Testnet',
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    explorerUrl: 'https://chainscan-galileo.0g.ai',
    nativeCurrency: { name: '0G', symbol: 'OG', decimals: 18 },
  },
};

// Default to testnet for development — switch to 'mainnet' for production
const DEFAULT_NETWORK = 'testnet';

/* ─── Wallet State ─── */

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
  network: NetworkConfig;
  networkKey: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (key: string) => Promise<void>;
  switchToCorrectNetwork: () => Promise<void>;
  shortAddress: string;
  explorerUrl: string;
}

const WalletContext = createContext<WalletState | null>(null);

const shortenAddress = (addr: string): string =>
  `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const getProvider = () =>
  typeof window !== 'undefined' && window.ethereum ? window.ethereum : null;

/* ─── Provider ─── */

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkKey, setNetworkKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('0g_network') || DEFAULT_NETWORK;
    }
    return DEFAULT_NETWORK;
  });

  const network = OG_NETWORKS[networkKey] ?? OG_NETWORKS[DEFAULT_NETWORK]!;
  const isCorrectNetwork = chainId === network.chainId;

  // ── Add & switch to the selected 0G network ──
  const addAndSwitchChain = useCallback(
    async (net: NetworkConfig) => {
      const provider = getProvider();
      if (!provider) return;

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: net.hexChainId }],
        });
      } catch (err: any) {
        if (err.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: net.hexChainId,
                chainName: net.name,
                nativeCurrency: net.nativeCurrency,
                rpcUrls: [net.rpcUrl],
                blockExplorerUrls: [net.explorerUrl],
              },
            ],
          });
        } else {
          throw err;
        }
      }
    },
    []
  );

  // ── Reconnect on page load ──
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;
    if (localStorage.getItem('0g_wallet_connected') !== 'true') return;

    provider
      .request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]!);
          provider
            .request({ method: 'eth_chainId' })
            .then((id: string) => setChainId(parseInt(id, 16)));
        }
      })
      .catch(() => {});
  }, []);

  // ── Listen for wallet events ──
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const handleAccounts = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        localStorage.removeItem('0g_wallet_connected');
      } else {
        setAddress(accounts[0]!);
      }
    };

    const handleChain = (id: string) => setChainId(parseInt(id, 16));

    provider.on('accountsChanged', handleAccounts);
    provider.on('chainChanged', handleChain);
    return () => {
      provider.removeListener('accountsChanged', handleAccounts);
      provider.removeListener('chainChanged', handleChain);
    };
  }, []);

  // ── Connect ──
  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setError('No wallet found. Install MetaMask or another EVM wallet.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts: string[] = await provider.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length === 0) throw new Error('No accounts returned');

      setAddress(accounts[0]!);
      localStorage.setItem('0g_wallet_connected', 'true');

      const currentChain = await provider.request({ method: 'eth_chainId' });
      const currentId = parseInt(currentChain as string, 16);
      setChainId(currentId);

      if (currentId !== network.chainId) {
        await addAndSwitchChain(network);
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [network, addAndSwitchChain]);

  // ── Disconnect ──
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setError(null);
    localStorage.removeItem('0g_wallet_connected');
  }, []);

  // ── Switch target network (mainnet ↔ testnet) ──
  const switchNetwork = useCallback(
    async (key: string) => {
      const target = OG_NETWORKS[key];
      if (!target) return;

      setNetworkKey(key);
      localStorage.setItem('0g_network', key);

      if (address) {
        await addAndSwitchChain(target);
      }
    },
    [address, addAndSwitchChain]
  );

  // ── Switch wallet to the currently-selected 0G network ──
  const switchToCorrectNetwork = useCallback(async () => {
    await addAndSwitchChain(network);
  }, [network, addAndSwitchChain]);

  const value: WalletState = {
    address,
    chainId,
    isConnecting,
    isConnected: !!address,
    isCorrectNetwork,
    error,
    network,
    networkKey,
    connect,
    disconnect,
    switchNetwork,
    switchToCorrectNetwork,
    shortAddress: address ? shortenAddress(address) : '',
    explorerUrl: network.explorerUrl,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = (): WalletState => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>');
  return ctx;
};
