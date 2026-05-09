'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body { background: #050505; font-family: 'DM Sans', sans-serif; color: #fff; }

        .shell {
          position: relative; width: 100vw; height: 100vh;
          display: flex; flex-direction: column; overflow: hidden; background: #050505;
        }
        .glow { position: absolute; pointer-events: none; border-radius: 50%; }
        .glow-tl {
          top: -25%; left: -12%; width: 52vw; height: 52vw;
          background: radial-gradient(ellipse, rgba(210,72,8,0.52) 0%, transparent 68%);
          animation: breathe 7s ease-in-out infinite;
        }
        .glow-tr {
          top: -25%; right: -12%; width: 48vw; height: 48vw;
          background: radial-gradient(ellipse, rgba(210,72,8,0.42) 0%, transparent 68%);
          animation: breathe 7s ease-in-out infinite 1.4s;
        }
        .glow-mid {
          top: 38%; left: 50%; width: 28vw; height: 28vw;
          background: radial-gradient(ellipse, rgba(249,115,22,0.16) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          animation: breatheMid 5s ease-in-out infinite .7s;
        }
        @keyframes breathe {
          0%,100% { opacity:.78; transform:scale(1); }
          50%      { opacity:1;   transform:scale(1.07); }
        }
        @keyframes breatheMid {
          0%,100% { opacity:.7;  transform:translate(-50%,-50%) scale(1); }
          50%      { opacity:1;   transform:translate(-50%,-50%) scale(1.12); }
        }

        .nav {
          position: relative; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 2.25rem; flex-shrink: 0;
        }
        .logo {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 0.95rem; letter-spacing: -0.01em;
          display: flex; align-items: center; gap: 0.4rem; text-decoration: none; color: #fff;
        }
        .logo-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #F97316;
          animation: logopulse 2.5s ease-in-out infinite; flex-shrink: 0;
        }
        @keyframes logopulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,.7); }
          50%      { box-shadow: 0 0 0 5px rgba(249,115,22,0); }
        }
        .wallet-adapter-button {
          background: #fff !important; color: #000 !important;
          border-radius: 999px !important; font-family: 'DM Sans', sans-serif !important;
          font-weight: 500 !important; font-size: 0.78rem !important;
          padding: 0.42rem 1.1rem !important; height: auto !important; line-height: 1.4 !important;
        }
        .wallet-adapter-button:not([disabled]):hover { background: rgba(255,255,255,.85) !important; }
        .wallet-adapter-button-start-icon { display: none !important; }

        .hero {
          position: relative; z-index: 10; flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 0 1rem;
        }
        h1 {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: clamp(2.4rem, 4.8vw, 4.2rem);
          line-height: 1.0; letter-spacing: -0.035em;
          color: #fff; margin-bottom: 0.8rem;
          animation: fadeUp .5s ease .08s both;
        }
        h1 .acc { color: #F97316; }
        .sub {
          font-size: clamp(0.78rem, 1.1vw, 0.9rem);
          color: rgba(255,255,255,0.4); max-width: 400px;
          line-height: 1.65; font-weight: 300; margin-bottom: 1.25rem;
          animation: fadeUp .5s ease .16s both;
        }
        .ctas { display: flex; gap: 0.65rem; animation: fadeUp .5s ease .22s both; }
        .btn-a {
          background: transparent; color: #fff;
          border: 1.5px solid rgba(255,255,255,0.32); border-radius: 999px;
          padding: 0.55rem 1.3rem; font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem; font-weight: 500; cursor: pointer;
          text-decoration: none; transition: background .2s, border-color .2s; display: inline-block;
        }
        .btn-a:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.55); }
        .btn-b {
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.48);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 999px;
          padding: 0.55rem 1.3rem; font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem; cursor: pointer; text-decoration: none;
          transition: background .2s; display: inline-block;
        }
        .btn-b:hover { background: rgba(255,255,255,0.09); }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .orb-zone {
          position: relative; width: 100%; max-width: 720px;
          height: 26vh; min-height: 180px; margin-top: 1.5vh;
          flex-shrink: 0; animation: fadeUp .5s ease .3s both;
        }
        .circuit { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.2; }
        .chip {
          position: absolute;
          background: rgba(14,14,14,0.85); border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          color: rgba(255,255,255,0.68); font-size: 0.7rem; font-family: 'DM Sans', sans-serif;
          padding: 0.28rem 0.75rem; border-radius: 999px;
          display: flex; align-items: center; gap: 0.35rem; white-space: nowrap;
        }
        .cdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .co { background: #F97316; } .cg { background: #22c55e; }
        .c1 { top: 18%; left: 6%; } .c2 { top: 10%; right: 8%; }
        .c3 { bottom: 18%; left: 10%; } .c4 { bottom: 16%; right: 6%; }
        .orb {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 88px; height: 88px; border-radius: 50%; background: #080808;
          border: 1.5px solid rgba(249,115,22,0.32);
          box-shadow: 0 0 28px rgba(249,115,22,.28), 0 0 60px rgba(249,115,22,.1), inset 0 0 20px rgba(249,115,22,.07);
          display: flex; align-items: center; justify-content: center;
          animation: orbglow 4s ease-in-out infinite;
        }
        .orb-core {
          width: 48px; height: 48px; border-radius: 50%;
          background: radial-gradient(circle at 37% 34%, #fb923c, #ea580c 55%, #7c2d12);
        }
        @keyframes orbglow {
          0%,100% { box-shadow: 0 0 28px rgba(249,115,22,.28), 0 0 60px rgba(249,115,22,.10), inset 0 0 20px rgba(249,115,22,.07); }
          50%      { box-shadow: 0 0 46px rgba(249,115,22,.46), 0 0 100px rgba(249,115,22,.20), inset 0 0 32px rgba(249,115,22,.14); }
        }

        .strip {
          position: relative; z-index: 10;
          display: grid; grid-template-columns: repeat(3,1fr);
          border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
        }
        .feat {
          padding: 1.1rem 1.5rem; display: flex; align-items: flex-start; gap: 0.85rem;
          transition: background .25s; cursor: pointer;
        }
        .feat:hover { background: rgba(249,115,22,0.04); }
        .feat + .feat { border-left: 1px solid rgba(255,255,255,0.06); }
        .feat-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(249,115,22,0.09); border: 1px solid rgba(249,115,22,0.17);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0; margin-top: 1px;
        }
        .feat-title { font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700; margin-bottom: 0.22rem; color: #fff; }
        .feat-desc { font-size: 0.73rem; color: rgba(255,255,255,0.35); line-height: 1.55; font-weight: 300; }

        .foot {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.6rem 2.25rem; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
        }
        .foot-l { font-size: 0.68rem; color: rgba(255,255,255,0.18); }
        .foot-r { display: flex; align-items: center; gap: 0.38rem; font-size: 0.68rem; color: rgba(255,255,255,0.25); }
        .sdot { width: 5px; height: 5px; border-radius: 50%; background: #9945FF; }
      `}</style>

      <div className="shell">
        <div className="glow glow-tl" />
        <div className="glow glow-tr" />
        <div className="glow glow-mid" />

        <nav className="nav">
          <Link href="/" className="logo"><span className="logo-dot" />ProvenanceChain</Link>
          <WalletMultiButton />
        </nav>

        <section className="hero">
          <h1>Prove It.<br /><span className="acc">On‑Chain.</span></h1>
          <p className="sub">
            An immutable, cryptographic record of your research — timestamped on Solana, verifiable by anyone, trusted by no one institution.
          </p>
          <div className="ctas">
            <Link href="/submit" className="btn-a">Record a Paper</Link>
            <Link href="/verify" className="btn-b">Verify a Document</Link>
            <Link href="/update" className="btn-b">Manage Status</Link>
          </div>

          <div className="orb-zone">
            <svg className="circuit" viewBox="0 0 720 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="360" y1="100" x2="75"  y2="44"  stroke="#F97316" strokeWidth="0.7" strokeDasharray="4 5"/>
              <line x1="360" y1="100" x2="650" y2="34"  stroke="#F97316" strokeWidth="0.7" strokeDasharray="4 5"/>
              <line x1="360" y1="100" x2="108" y2="170" stroke="#F97316" strokeWidth="0.7" strokeDasharray="4 5"/>
              <line x1="360" y1="100" x2="628" y2="164" stroke="#F97316" strokeWidth="0.7" strokeDasharray="4 5"/>
              <circle cx="75"  cy="44"  r="2.2" fill="#F97316" opacity="0.65"/>
              <circle cx="650" cy="34"  r="2.2" fill="#F97316" opacity="0.65"/>
              <circle cx="108" cy="170" r="2.2" fill="#F97316" opacity="0.65"/>
              <circle cx="628" cy="164" r="2.2" fill="#F97316" opacity="0.65"/>
              <circle cx="360" cy="100" r="4.5" fill="#F97316" opacity="0.3"/>
            </svg>
            <div className="chip c1"><span className="cdot co"/>Immutable</div>
            <div className="chip c2"><span className="cdot cg"/>Encrypted</div>
            <div className="chip c3"><span className="cdot cg"/>Verified</div>
            <div className="chip c4"><span className="cdot co"/>Tamper‑Proof</div>
            <div className="orb"><div className="orb-core" /></div>
          </div>
        </section>

        <div className="strip">
          <div className="feat">
            <div className="feat-icon">📄</div>
            <div><div className="feat-title">Record</div><p className="feat-desc">SHA-256 fingerprint committed to Solana. The file never leaves your machine.</p></div>
          </div>
          <div className="feat">
            <div className="feat-icon">✅</div>
            <div><div className="feat-title">Verify</div><p className="feat-desc">Upload any document — tampering detected against the on-chain record instantly.</p></div>
          </div>
          <div className="feat">
            <div className="feat-icon">🔍</div>
            <div><div className="feat-title">Track</div><p className="feat-desc">Active → Updated → Retracted. Every status change committed on-chain, forever.</p></div>
          </div>
        </div>

        <div className="foot">
          <span className="foot-l">OnchainED 1.0 · Hackathon Build</span>
          <div className="foot-r"><span className="sdot"/>Powered by Solana Devnet</div>
        </div>
      </div>
    </>
  );
}