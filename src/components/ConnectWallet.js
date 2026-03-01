import React, { useState, useEffect } from 'react';
import { useUnlink } from '@unlink-xyz/react';

const ConnectWallet = ({ onConnect }) => {
  const { ready: unlinkReady, walletExists: unlinkWalletExists, createWallet, createAccount } = useUnlink();
  const [connectingId, setConnectingId] = useState(null);
  const [unlinkMnemonic, setUnlinkMnemonic] = useState(null);
  const [pendingUnlinkConnect, setPendingUnlinkConnect] = useState(null);

  const unlinkOption = {
    name: 'Unlink',
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDIyczgtNCA4LTEwUzEyIDIgMTIgMnMtOCA0LTggMTAgNCA4IDggMTAiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIi8+PC9zdmc+',
    description: 'Private wallet for confidential bounties (uses MetaMask on Monad)'
  };
  const [unlinkAvailable, setUnlinkAvailable] = useState(false);

  // Check for installed wallets when component mounts
  useEffect(() => {
    try {
      checkInstalledWallets();
    } catch (error) {
      console.error("Error checking installed wallets:", error);
    }
  }, []);

  // Check if MetaMask/ethereum is available (required for Unlink)
  const checkInstalledWallets = () => {
    try {
      const hasEthereum = !!window.ethereum && (
        window.ethereum.isMetaMask ||
        (window.ethereum.providers && window.ethereum.providers.some(p => p.isMetaMask))
      );
      setUnlinkAvailable(!!hasEthereum);
    } catch (error) {
      console.error('Error checking wallet installation:', error);
    }
  };

  // Connect via Unlink (private wallet - uses MetaMask under the hood)
  const connectWallet = async () => {
    setConnectingId('unlink');
    try {
      if (window.ethereum) {
            let provider = window.ethereum;
            if (window.ethereum.providers) {
              provider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
            }
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
              const chainId = '0x279f';
              try {
                await provider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: chainId }],
                });
              } catch (switchError) {
                if (switchError.code === 4902) {
                  try {
                    await provider.request({
                      method: 'wallet_addEthereumChain',
                      params: [
                        {
                          chainId: chainId,
                          chainName: 'Monad Testnet',
                          rpcUrls: ['https://testnet-rpc.monad.xyz'],
                          nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                          blockExplorerUrls: ['https://testnet.monadexplorer.com']
                        }
                      ],
                    });
                  } catch (addError) {
                    console.error('Failed to add network:', addError);
                    alert("Please add the Monad Testnet to your wallet.");
                  }
                }
              }
              if (unlinkReady && !unlinkWalletExists) {
                try {
                  const { mnemonic } = await createWallet();
                  await createAccount();
                  setUnlinkMnemonic(mnemonic);
                  setPendingUnlinkConnect({ account: accounts[0], provider });
                  setConnectingId(null);
                  return;
                } catch (unlinkErr) {
                  console.error('Unlink wallet creation failed:', unlinkErr);
                  alert('Could not create Unlink private wallet. You can set it up later from your profile.');
                }
              }
              onConnect(accounts[0], 'ethereum', provider);
            } else {
              throw new Error('No accounts returned');
            }
          } else {
            window.open('https://metamask.io/download/', '_blank');
          }
    } catch (error) {
      console.error('Error connecting to Unlink:', error);
      alert('Could not connect. Please make sure MetaMask is installed and try again.');
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-zinc-950 p-8 rounded-sm shadow-sm border border-zinc-800 max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="h-16 w-16 mx-auto text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {unlinkMnemonic ? 'Backup Your Unlink Recovery Phrase' : 'Connect Your Wallet'}
        </h1>

        {unlinkMnemonic ? (
          <div className="text-left mb-6">
            <p className="text-gray-400 mb-4">
              Your Unlink private wallet was created. Write down this recovery phrase and store it safely. You will need it to recover your private funds.
            </p>
            <div className="bg-amber-950/50 border border-amber-700/50 rounded-sm p-4 mb-4">
              <p className="text-amber-200 text-sm font-mono break-all select-all">{unlinkMnemonic}</p>
            </div>
            <button
              onClick={() => {
                if (pendingUnlinkConnect) {
                  setUnlinkMnemonic(null);
                  onConnect(pendingUnlinkConnect.account, 'ethereum', pendingUnlinkConnect.provider);
                  setPendingUnlinkConnect(null);
                }
              }}
              disabled={!pendingUnlinkConnect}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-sm transition-colors"
            >
              I&apos;ve backed it up, continue
            </button>
          </div>
        ) : null}

        {!unlinkMnemonic && (
        <>
        <p className="text-gray-400 mb-6">
          Connect your wallet to analyze GitHub profiles and store results on the blockchain.
        </p>

        <div className="space-y-3">
          <button
            onClick={connectWallet}
            disabled={connectingId !== null}
            className="w-full flex items-center justify-between p-3 border border-zinc-700 bg-zinc-900 rounded-sm hover:bg-zinc-800 hover:border-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center">
              <div className="h-8 w-8 mr-3 flex items-center justify-center bg-black rounded-sm border border-zinc-700 overflow-hidden">
                <img
                  src={unlinkOption.icon}
                  alt={unlinkOption.name}
                  className="h-6 w-6"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS13YWxsZXQiPjxwYXRoIGQ9Ik0yMSA4djEzYTEgMSAwIDAgMS0xIDFINGExIDEgMCAwIDEtMS0xVjhjMC0xLjEuOS0yIDItMmgxNGMxLjEgMCAyIC45IDIgMnpNMSA4aDIyIi8+PC9zdmc+';
                  }}
                />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">{unlinkOption.name}</p>
                <p className="text-xs text-gray-400">{unlinkOption.description}</p>
              </div>
            </div>
            {connectingId === 'unlink' ? (
              <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-sm animate-pulse">
                Connecting...
              </span>
            ) : unlinkAvailable ? (
              <span className="text-xs bg-zinc-800 text-white px-2 py-1 rounded-sm border border-zinc-600">
                Available
              </span>
            ) : (
              <span className="text-xs bg-zinc-950 text-gray-400 px-2 py-1 rounded-sm border border-zinc-800">
                Install MetaMask
              </span>
            )}
          </button>
        </div>
        </>
        )}

        {/* Error debugging section - only appears in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 border-t border-zinc-800 pt-4 text-left">
            <details>
              <summary className="cursor-pointer text-xs text-gray-500">Debug Info</summary>
              <div className="mt-2 text-xs text-gray-400 bg-zinc-900 border border-zinc-800 p-3 rounded-sm overflow-auto max-h-40">
                <p>ethereum available: {window.ethereum ? 'Yes' : 'No'}</p>
                <p>injectedWeb3 available: {window.injectedWeb3 ? 'Yes' : 'No'}</p>
              </div>
            </details>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-gray-400 max-w-md">
        <h2 className="font-semibold text-lg mb-2 text-white">Why Connect a Wallet?</h2>
        <p>
          Your wallet allows you to interact with the blockchain to store and retrieve
          GitHub profile analysis data in a decentralized way. Your wallet address serves as your
          identity in this web3 application.
        </p>
      </div>
    </div>
  );
};

export default ConnectWallet;