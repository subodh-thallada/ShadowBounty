import React, { useState, useEffect } from 'react';

const ConnectWallet = ({ onConnect }) => {
  const [walletOptions, setWalletOptions] = useState([
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: 'https://metamask.io/images/metamask-fox.svg',
      installed: false,
      description: 'Connect with MetaMask wallet on Monad'
    },
    {
      id: 'subwallet',
      name: 'SubWallet',
      icon: '/assets/subwallet-logo.svg', // You'll need to add this asset
      installed: false,
      description: 'Connect with SubWallet for Polkadot ecosystem'
    }
  ]);

  // Check for installed wallets when component mounts
  useEffect(() => {
    try {
      checkInstalledWallets();
    } catch (error) {
      console.error("Error checking installed wallets:", error);
    }
  }, []);

  // Function to check which wallets are installed
  const checkInstalledWallets = () => {
    const updatedOptions = walletOptions.map(option => {
      let installed = false;

      try {
        switch (option.id) {
          case 'metamask':
            installed = !!window.ethereum && (window.ethereum.isMetaMask ||
              (window.ethereum.providers &&
                window.ethereum.providers.some(p => p.isMetaMask)));
            break;
          case 'subwallet':
            installed = !!window.injectedWeb3 && !!window.injectedWeb3['subwallet-js'];
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Error checking ${option.id} installation:`, error);
      }

      return { ...option, installed };
    });

    setWalletOptions(updatedOptions);
  };

  // Connect to the selected wallet
  const connectWallet = async (walletId) => {
    try {
      switch (walletId) {
        case 'metamask':
          if (window.ethereum) {
            let provider = window.ethereum;

            // Handle multiple providers (like MetaMask + another wallet)
            if (window.ethereum.providers) {
              provider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
            }

            // Request account access using MetaMask
            const accounts = await provider.request({
              method: 'eth_requestAccounts'
            });

            if (accounts && accounts.length > 0) {
              // Ensure we are on Monad Testnet (Chain ID 10143 / 0x279f)
              const chainId = '0x279f';
              try {
                await provider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: chainId }],
                });
              } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                  try {
                    await provider.request({
                      method: 'wallet_addEthereumChain',
                      params: [
                        {
                          chainId: chainId,
                          chainName: 'Monad Testnet',
                          rpcUrls: ['https://testnet-rpc.monad.xyz'],
                          nativeCurrency: {
                            name: 'MON',
                            symbol: 'MON',
                            decimals: 18
                          },
                          blockExplorerUrls: ['https://testnet.monadexplorer.com']
                        }
                      ],
                    });
                  } catch (addError) {
                    console.error('Failed to add network:', addError);
                    alert("Please add the Monad Testnet to your wallet.");
                  }
                } else {
                  console.error('Failed to switch network:', switchError);
                }
              }

              onConnect(accounts[0], 'ethereum', provider);
            } else {
              throw new Error('No accounts returned from MetaMask');
            }
          } else {
            window.open('https://metamask.io/download/', '_blank');
          }
          break;

        case 'subwallet':
          if (window.injectedWeb3 && window.injectedWeb3['subwallet-js']) {
            try {
              // We're simplifying this to just trigger a basic connection
              // Without the full Polkadot integration for now
              const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
              });

              if (accounts && accounts.length > 0) {
                // Just use regular Ethereum connection for now
                onConnect(accounts[0], 'ethereum', window.ethereum);

                // The commented code below shows how you would connect to SubWallet
                // when you're ready to implement the full Polkadot integration
                /*
                const subwallet = window.injectedWeb3['subwallet-js'];
                const extension = await subwallet.enable('ShadowBounty');
                const accounts = await extension.accounts.get();
                
                if (accounts && accounts.length > 0) {
                  onConnect(accounts[0].address, 'polkadot', extension);
                }
                */
              }
            } catch (error) {
              console.error("SubWallet connection error:", error);
              // Fallback to regular Ethereum connection
              if (window.ethereum) {
                const accounts = await window.ethereum.request({
                  method: 'eth_requestAccounts'
                });
                if (accounts && accounts.length > 0) {
                  onConnect(accounts[0], 'ethereum', window.ethereum);
                }
              }
            }
          } else {
            window.open('https://subwallet.app/download.html', '_blank');
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error connecting to ${walletId}:`, error);
      alert(`Could not connect to ${walletId}. Please make sure it's installed and try again.`);
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

        <h1 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h1>

        <p className="text-gray-400 mb-6">
          Connect your wallet to analyze GitHub profiles and store results on the blockchain.
        </p>

        <div className="space-y-3">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => connectWallet(wallet.id)}
              className="w-full flex items-center justify-between p-3 border border-zinc-700 bg-zinc-900 rounded-sm hover:bg-zinc-800 hover:border-white transition-colors"
            >
              <div className="flex items-center">
                <div className="h-8 w-8 mr-3 flex items-center justify-center bg-black rounded-sm border border-zinc-700 overflow-hidden">
                  <img
                    src={wallet.icon}
                    alt={wallet.name}
                    className="h-6 w-6"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS13YWxsZXQiPjxwYXRoIGQ9Ik0yMSA4djEzYTEgMSAwIDAgMS0xIDFINGExIDEgMCAwIDEtMS0xVjhjMC0xLjEuOS0yIDItMmgxNGMxLjEgMCAyIC45IDIgMnpNMSA4aDIyIi8+PC9zdmc+';
                    }}
                  />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">{wallet.name}</p>
                  <p className="text-xs text-gray-400">{wallet.description}</p>
                </div>
              </div>
              {wallet.installed ? (
                <span className="text-xs bg-zinc-800 text-white px-2 py-1 rounded-sm border border-zinc-600">
                  Available
                </span>
              ) : (
                <span className="text-xs bg-zinc-950 text-gray-400 px-2 py-1 rounded-sm border border-zinc-800">
                  Install
                </span>
              )}
            </button>
          ))}
        </div>

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