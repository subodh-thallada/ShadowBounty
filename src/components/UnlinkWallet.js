import React, { useState, useEffect } from 'react';
import { useUnlink, useUnlinkBalances } from '@unlink-xyz/react';
import { ethers } from 'ethers';

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
];

const UnlinkWallet = ({ isOpen, onClose, userAddress }) => {
    const {
        ready,
        walletExists,
        activeAccount,
        createWallet,
        createAccount,
        exportMnemonic,
        unlink
    } = useUnlink();

    const { balances } = useUnlinkBalances();

    const [mnemonic, setMnemonic] = useState('');
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);
    const [depositTokenAddress, setDepositTokenAddress] = useState(process.env.REACT_APP_PAYMENT_TOKEN_ADDRESS || '');
    const [error, setError] = useState(null);

    // Auto-create account if wallet exists but hasn't created one
    useEffect(() => {
        if (ready && walletExists && !activeAccount) {
            createAccount().catch(console.error);
        }
    }, [ready, walletExists, activeAccount, createAccount]);

    // Sync token balance when opened
    useEffect(() => {
        if (isOpen && unlink && ready) {
            unlink.sync().catch(console.error);
        }
    }, [isOpen, unlink, ready]);

    if (!isOpen) return null;

    const handleCreateWallet = async () => {
        try {
            setError(null);
            const result = await createWallet();
            setMnemonic(result.mnemonic);
            setShowMnemonic(true);
            await createAccount();
        } catch (err) {
            setError('Failed to create wallet: ' + err.message);
        }
    };

    const handleExportBackup = async () => {
        try {
            const mn = await exportMnemonic();
            setMnemonic(mn);
            setShowMnemonic(true);
        } catch (err) {
            setError('Failed to export mnemonic: ' + err.message);
        }
    };

    const handleDeposit = async () => {
        if (!userAddress) {
            setError('Please connect your MetaMask wallet first to deposit');
            return;
        }

        if (!depositTokenAddress || !depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) {
            setError('Please enter a valid token address and amount');
            return;
        }

        setIsDepositing(true);
        setError(null);

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            const tokenContract = new ethers.Contract(depositTokenAddress, ERC20_ABI, signer);
            const decimals = await tokenContract.decimals();
            const parsedAmount = ethers.utils.parseUnits(depositAmount.toString(), decimals);

            // 1. Get deposit parameters from Unlink
            const depositResult = await unlink.deposit([{
                token: depositTokenAddress,
                amount: parsedAmount,
                depositor: userAddress
            }]);

            console.log('Unlink Deposit Params:', depositResult);

            // 2. We must approve the Unlink Gateway proxy to spend our tokens
            // If the token requires approval, we prompt the user
            // Assuming depositResult.to is the gateway we need to approve
            const gatewayAddress = depositResult.to;
            const currentAllowance = await tokenContract.allowance(userAddress, gatewayAddress);

            if (currentAllowance.lt(parsedAmount)) {
                const approveTx = await tokenContract.approve(gatewayAddress, ethers.constants.MaxUint256);
                await approveTx.wait();
                console.log("Approval complete");
            }

            // 3. Execute the deposit transaction via MetaMask
            const tx = await signer.sendTransaction({
                to: depositResult.to,
                data: depositResult.calldata,
                value: 0 // ERC20 deposit, no native ETH sent
            });

            await tx.wait();

            // Request an immediate sync to show the new balance
            await unlink.sync();

            setDepositAmount('');
            alert('Deposit successful! Your funds are now private.');
        } catch (err) {
            console.error(err);
            setError('Deposit failed: ' + err.message);
        } finally {
            setIsDepositing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-black/80" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-zinc-950 border border-zinc-800 rounded-sm text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-xl leading-6 font-semibold text-white mb-4 text-center font-sans">
                                    Unlink Private Wallet
                                </h3>

                                {!ready ? (
                                    <div className="flex justify-center p-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                ) : !walletExists ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-400 mb-6">
                                            Create an Unlink private wallet to fund your bounties privately. These funds are isolated from your public MetaMask address.
                                        </p>
                                        <button
                                            onClick={handleCreateWallet}
                                            className="w-full inline-flex justify-center rounded-sm border border-white px-4 py-2 text-base font-medium text-white hover:bg-white hover:text-black focus:outline-none transition-colors"
                                        >
                                            Create Private Wallet
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Private Dashboard */}
                                        {activeAccount && (
                                            <div className="bg-black border border-zinc-800 rounded-sm p-5 mb-6">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Active Account</span>
                                                    <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-sm text-white">
                                                        {activeAccount.address.slice(0, 10)}...{activeAccount.address.slice(-4)}
                                                    </span>
                                                </div>
                                                <div className="mt-4">
                                                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Private Balance</span>
                                                    {Object.entries(balances || {}).length === 0 ? (
                                                        <div className="text-2xl font-bold mt-1 text-white font-sans">0 TOKENS</div>
                                                    ) : (
                                                        <div className="mt-1">
                                                            {Object.entries(balances).map(([token, balance]) => (
                                                                <div key={token} className="text-xl font-semibold break-all text-white">
                                                                    {ethers.utils.formatEther(balance.toString())} (raw)
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Deposit Section */}
                                        <div className="border border-zinc-800 rounded-sm p-4 mb-4">
                                            <h4 className="font-semibold text-white mb-2 font-sans">Deposit from Public Wallet</h4>
                                            <p className="text-xs text-gray-500 mb-3">
                                                Move tokens from MetaMask into your private Unlink balance. Currently requires test tokens.
                                            </p>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Token Address</label>
                                                    <input
                                                        type="text"
                                                        value={depositTokenAddress}
                                                        onChange={(e) => setDepositTokenAddress(e.target.value)}
                                                        className="w-full text-sm bg-zinc-900 border border-zinc-700 rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white px-3 py-2"
                                                        placeholder="0x..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                                                    <input
                                                        type="number"
                                                        value={depositAmount}
                                                        onChange={(e) => setDepositAmount(e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.0"
                                                        className="w-full text-sm bg-zinc-900 border border-zinc-700 rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white px-3 py-2"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleDeposit}
                                                    disabled={isDepositing || !depositAmount || !depositTokenAddress}
                                                    className={`w-full flex justify-center py-2 px-4 border border-white rounded-sm text-sm font-medium text-white hover:bg-white hover:text-black focus:outline-none transition-colors ${isDepositing || !depositAmount ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-white' : ''}`}
                                                >
                                                    {isDepositing ? 'Depositing...' : 'Deposit to Private Wallet'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Secret Backup */}
                                        {showMnemonic ? (
                                            <div className="bg-yellow-950/30 border border-yellow-800 p-4 mb-4 rounded-sm">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <span className="text-yellow-400 text-xl">⚠️</span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <h3 className="text-sm text-yellow-200 font-medium">Backup your recovery phrase!</h3>
                                                        <div className="mt-2 text-sm text-yellow-300 font-mono bg-black/30 p-2 rounded-sm break-all tracking-wide border border-yellow-800">
                                                            {mnemonic}
                                                        </div>
                                                        <p className="mt-2 text-xs text-yellow-300">
                                                            Write this down. It will only be shown once. If you lose it, your private funds are gone.
                                                        </p>
                                                        <button
                                                            onClick={() => setShowMnemonic(false)}
                                                            className="mt-2 text-xs font-semibold underline text-yellow-400 hover:text-yellow-300"
                                                        >
                                                            I've backed it up
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-right">
                                                <button
                                                    onClick={handleExportBackup}
                                                    className="text-xs text-red-400 hover:text-red-300 underline"
                                                >
                                                    Export Recovery Phrase
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-4 p-4 bg-red-950/30 border border-red-800 text-red-400 text-sm rounded-sm">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-zinc-800">
                        <button
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-sm border border-zinc-700 px-4 py-2 text-base font-medium text-white hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnlinkWallet;
