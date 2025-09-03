import { type Address } from 'viem';
import stakingAbi from '../../lib/contracts/abis/Staking.json';
import lendingPoolAbi from '../../lib/contracts/abis/LendingPool.json';
import invoiceNFTAbi from '../../lib/contracts/abis/InvoiceNFT.json';
import mockERC20Abi from '../../lib/contracts/abis/MockERC20.json';
import borrowRegistryAbi from '../../lib/contracts/abis/BorrowRegistry.json';


// These addresses will be updated after deployment for avalanche
export const CONTRACT_ADDRESSES = {
  STAKING: '0x72fAB2dbc8704bbaa75F3d9d54f2Cb473a4c8B56' as Address,
  LENDING_POOL: '0x1495C76B00247405B3442e1F8eA8E0131b15E113' as Address,
  INVOICE_NFT: '0x96d255f4a4452C61Be2A90eA7184091aEe59dEeb' as Address,
  METRIK_TOKEN: '0xF2476514dCa239950A5465ce1d714F15eF3a75f5' as Address,
  USDC: '0x2DEF22b734551C9E0384824Cc2847674027eec31' as Address,
  BORROW_REGISTRY: '0x15529dedd756C79aE4Ab8D7d0f73B8664Fb01C29' as Address,
} as const;

export const CONTRACT_ABIS = {
  STAKING: stakingAbi.abi,
  LENDING_POOL: lendingPoolAbi.abi,
  INVOICE_NFT: invoiceNFTAbi.abi,
  MOCK_ERC20: mockERC20Abi.abi,
  BORROW_REGISTRY: borrowRegistryAbi.abi,
} as const;

export const SUPPORTED_CHAINS = [
  {
    id: 43113,
    name: 'Avalanche Fuji',
    network: 'avalanche-fuji',
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
  },
] as const; 