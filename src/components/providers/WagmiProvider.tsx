'use client';

import { WagmiProvider as WagmiProviderV2, createConfig, http } from 'wagmi';
import { type ReactNode } from 'react';

// Avalanche Testnet chain config
const avalancheTestnet = {
  id: 43113,
  name: 'Avalanche Testnet',
  network: 'avalanche-testnet',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
    public: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://testnet.snowtrace.io' },
  },
};

const config = createConfig({
  chains: [avalancheTestnet],
  transports: {
    [avalancheTestnet.id]: http('https://api.avax-test.network/ext/bc/C/rpc'),
  },
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return <WagmiProviderV2 config={config}>{children}</WagmiProviderV2>;
} 