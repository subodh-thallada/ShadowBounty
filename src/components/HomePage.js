import React from 'react';
import { Link } from 'react-router-dom';
import { HiSparkles, HiShieldCheck, HiLockClosed } from 'react-icons/hi';

const Feature = ({ Icon, title, children }) => (
  <div className="flex gap-4 p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
    <div className="p-3 bg-zinc-800 rounded-md flex items-center justify-center text-indigo-300">
      <Icon size={22} />
    </div>
    <div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="text-sm text-gray-300 mt-1">{children}</p>
    </div>
  </div>
);

const HomePage = ({ account, verifiedUsername, verified, onConnect }) => {
  return (
    <div className="max-w-4xl mx-auto py-16">
      <section className="text-center">
        <p className="text-sm text-indigo-300 font-medium">Open Source • Decentralized • Auditable</p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white leading-tight">The Web3 Bounty Platform for Builders & Projects</h1>
        <p className="mt-6 text-gray-300 max-w-2xl mx-auto">Connect with top developers, fund meaningful contributions, and secure payments with smart-contract escrow.</p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/explore-bounties" className="inline-flex items-center px-5 py-3 bg-white text-black rounded-md shadow-sm hover:shadow-md font-medium">Discover Bounties</Link>
          <Link to="/project-onboarding" className="inline-flex items-center px-5 py-3 bg-transparent border border-zinc-700 text-white rounded-md hover:bg-zinc-900 font-medium">Create a Bounty</Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Feature Icon={HiSparkles} title="AI-Generated Bounties">We analyze repos to suggest meaningful, prioritized tasks.</Feature>
          <Feature Icon={HiLockClosed} title="Secure Escrow">Stake funds in audited smart contracts and automate payouts.</Feature>
          <Feature Icon={HiShieldCheck} title="Hybrid Validation">Combine AI checks, static analysis, and community review.</Feature>
        </div>
      </section>

      <section className="mt-16">
        <div className="md:flex md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold text-white">For Companies & Developers</h2>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Projects</h3>
            <ul className="list-disc ml-5 text-gray-300 text-sm space-y-1">
              <li>Connect your GitHub repo</li>
              <li>Let AI suggest optimal bounties</li>
              <li>Stake USDC securely</li>
              <li>Review validated submissions</li>
            </ul>
            <div className="mt-4">
              <Link to="/project-onboarding" className="px-4 py-2 bg-white text-black rounded font-medium">Post a Bounty</Link>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Developers</h3>
            <ul className="list-disc ml-5 text-gray-300 text-sm space-y-1">
              <li>Sign in with GitHub</li>
              <li>Discover skill-matched bounties</li>
              <li>Submit your solutions</li>
              <li>Get paid in USDC to your wallet</li>
            </ul>
            <div className="mt-4">
              <Link to="/explore-bounties" className="px-4 py-2 bg-white text-black rounded font-medium">Find Bounties</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 text-center">
        <h3 className="text-xl font-semibold mb-3 text-white">Ready to Start?</h3>
        <p className="text-gray-300 mb-6">Join shadowbounty-web3 and be part of the future of decentralized software development.</p>
        <div>
          {account ? (
            verified ? (
              <Link to={`/results/${verifiedUsername}`} className="px-8 py-4 bg-white text-black rounded-none font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white border border-white transition-colors">Go To Profile</Link>
            ) : (
              <Link to="/connect-github" className="px-8 py-4 bg-white text-black rounded-none font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white border border-white transition-colors">Connect GitHub Account</Link>
            )
          ) : (
            <Link to="/connect" className="px-8 py-4 bg-white text-black rounded-none font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white border border-white transition-colors">Connect Wallet</Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
