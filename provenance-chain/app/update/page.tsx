'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import Link from 'next/link';
import { getProgram, PROGRAM_ID } from '@/lib/provenanceChainProgram';

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

type Step = 'idle' | 'hashing' | 'fetching' | 'ready' | 'submitting' | 'done' | 'error';

interface PaperRecord {
  title: string;
  authors: string[];
  timestamp: number;
  status: string;
  owner: string;
}

export default function UpdatePage() {
  const { connection } = useConnection();
  const { connected, publicKey, signAllTransactions, signTransaction } = useWallet();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile]           = useState<File | null>(null);
  const [hash, setHash]           = useState('');
  const [step, setStep]           = useState<Step>('idle');
  const [record, setRecord]       = useState<PaperRecord | null>(null);
  const [newStatus, setNewStatus] = useState<'Updated' | 'Retracted'>('Updated');
  const [txSig, setTxSig]         = useState('');
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(false);
  const [notOwner, setNotOwner]   = useState(false);

  const processFile = async (f: File) => {
    if (!f.name.endsWith('.pdf')) return;
    setFile(f); setStep('hashing'); setHash(''); setRecord(null); setError(''); setNotOwner(false);
    const h = await hashFile(f);
    setHash(h);
    await fetchRecord(h);
  };

  const fetchRecord = async (h: string) => {
    setStep('fetching');
    try {
      const readOnlyWallet = {
        publicKey: PublicKey.default,
        signAllTransactions: async (txs: never) => txs,
        signTransaction: async (tx: never) => tx,
      };
      const provider = new AnchorProvider(connection, readOnlyWallet as never, { commitment: 'confirmed' });
      const program = getProgram(provider);

      const [pda] = PublicKey.findProgramAddressSync([Buffer.from(h.substring(0, 32))], PROGRAM_ID);
      const account = await (program.account as any).paperAccount.fetch(pda);

      const rawStatus = (account.status || {}) as Record<string, unknown>;
      const statusKey = Object.keys(rawStatus)[0] || 'Active';
      const status = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

      const ownerKey = account.owner.toBase58();

      setRecord({
        title: account.title,
        authors: account.authors,
        timestamp: Number(account.timestamp) * 1000,
        status,
        owner: ownerKey,
      });

      // Check ownership
      if (publicKey && ownerKey !== publicKey.toBase58()) {
        setNotOwner(true);
      } else {
        setNotOwner(false);
      }

      setStep('ready');
    } catch {
      setError('No matching document found on-chain. Make sure the PDF is already submitted.');
      setStep('error');
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleUpdate = async () => {
    if (!connected || !publicKey || !hash || !record) return;
    setStep('submitting'); setError('');
    try {
      const wallet = { publicKey, signAllTransactions, signTransaction };
      const provider = new AnchorProvider(connection, wallet as never, { commitment: 'confirmed' });
      const program = getProgram(provider);

      const [paperPDA] = PublicKey.findProgramAddressSync([Buffer.from(hash.substring(0, 32))], PROGRAM_ID);

      // Build the enum variant object Anchor expects: { updated: {} } or { retracted: {} }
      const statusVariant = newStatus === 'Updated'
        ? { updated: {} }
        : { retracted: {} };

      const tx = await (program.methods as any)
        .updateStatus(statusVariant)
        .accounts({ paper: paperPDA, owner: publicKey })
        .rpc();

      setTxSig(tx);
      setStep('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transaction failed.';
      setError(msg);
      setStep('error');
    }
  };

  const reset = () => {
    setFile(null); setHash(''); setStep('idle'); setRecord(null);
    setTxSig(''); setError(''); setNotOwner(false); setNewStatus('Updated');
    if (inputRef.current) inputRef.current.value = '';
  };

  const fmt = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  const statusColor = (s: string) => {
    if (s === 'Active')    return '#4ade80';
    if (s === 'Updated')   return '#60a5fa';
    if (s === 'Retracted') return '#facc15';
    return 'rgba(255,255,255,0.5)';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { min-height: 100%; }
        body { background: #050505; font-family: 'DM Sans', sans-serif; color: #fff; }

        .page { min-height: 100vh; background: #050505; position: relative; overflow: hidden; }
        .glow-br {
          position: absolute; bottom: -20%; right: -10%; width: 50vw; height: 50vw;
          border-radius: 50%; pointer-events: none;
          background: radial-gradient(ellipse, rgba(210,72,8,0.35) 0%, transparent 68%);
        }
        .nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 2.25rem; border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative; z-index: 50;
        }
        .logo {
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.95rem;
          display: flex; align-items: center; gap: 0.4rem; text-decoration: none; color: #fff;
        }
        .logo-dot { width: 7px; height: 7px; border-radius: 50%; background: #F97316; flex-shrink: 0; }
        .back {
          font-size: 0.78rem; color: rgba(255,255,255,0.4); text-decoration: none;
          transition: color .2s;
        }
        .back:hover { color: rgba(255,255,255,0.75); }
        .wallet-adapter-button {
          background: #fff !important; color: #000 !important; border-radius: 999px !important;
          font-family: 'DM Sans', sans-serif !important; font-weight: 500 !important;
          font-size: 0.78rem !important; padding: 0.42rem 1.1rem !important;
          height: auto !important; line-height: 1.4 !important;
        }
        .wallet-adapter-button-start-icon { display: none !important; }

        .body { max-width: 560px; margin: 0 auto; padding: 3rem 1.5rem; position: relative; z-index: 10; }
        .page-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2rem; letter-spacing: -0.03em; margin-bottom: 0.4rem; }
        .page-sub { font-size: 0.85rem; color: rgba(255,255,255,0.38); font-weight: 300; margin-bottom: 2.5rem; line-height: 1.6; }

        .drop {
          border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 16px;
          padding: 2.5rem 1.5rem; text-align: center; cursor: pointer;
          transition: border-color .2s, background .2s; margin-bottom: 1.5rem;
          background: rgba(255,255,255,0.02);
        }
        .drop:hover, .drop.dragging { border-color: rgba(249,115,22,0.5); background: rgba(249,115,22,0.03); }
        .drop-icon { font-size: 2rem; margin-bottom: 0.75rem; opacity: 0.7; }
        .drop-label { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-weight: 300; }
        .drop-label span { color: #F97316; cursor: pointer; }

        .file-pill {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(249,115,22,0.07); border: 1px solid rgba(249,115,22,0.2);
          border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.25rem;
        }
        .file-name { font-size: 0.82rem; font-weight: 500; }
        .file-size { font-size: 0.72rem; color: rgba(255,255,255,0.4); }

        .hash-box {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1.5rem;
        }
        .hash-label { font-size: 0.68rem; color: rgba(255,255,255,0.3); margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .hash-value { font-family: 'Courier New', monospace; font-size: 0.72rem; color: #F97316; word-break: break-all; line-height: 1.5; }

        .record-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;
        }
        .record-header { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem; margin-bottom: 1rem; color: rgba(255,255,255,0.85); }
        .meta { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 1rem; }
        .meta-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); gap: 1rem; }
        .meta-row:last-child { border-bottom: none; }
        .meta-key { font-size: 0.72rem; color: rgba(255,255,255,0.3); flex-shrink: 0; }
        .meta-val { font-size: 0.78rem; color: rgba(255,255,255,0.7); text-align: right; }

        .status-section { margin-bottom: 1.5rem; }
        .status-label { font-size: 0.78rem; color: rgba(255,255,255,0.5); margin-bottom: 0.75rem; display: block; }
        .status-options { display: flex; gap: 0.75rem; }
        .status-opt {
          flex: 1; padding: 1rem; border-radius: 12px; cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02);
          text-align: center; transition: all .2s;
        }
        .status-opt:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }
        .status-opt.selected-updated { border-color: rgba(96,165,250,0.5); background: rgba(96,165,250,0.06); }
        .status-opt.selected-retracted { border-color: rgba(250,204,21,0.5); background: rgba(250,204,21,0.06); }
        .status-opt-icon { font-size: 1.5rem; margin-bottom: 0.4rem; }
        .status-opt-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.2rem; }
        .status-opt-desc { font-size: 0.7rem; color: rgba(255,255,255,0.35); line-height: 1.4; }
        .status-opt-name.blue { color: #60a5fa; }
        .status-opt-name.yellow { color: #facc15; }

        .update-btn {
          width: 100%; color: #fff; border: none;
          border-radius: 12px; padding: 0.9rem; font-family: 'Syne', sans-serif;
          font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: background .2s, opacity .2s;
        }
        .update-btn.btn-updated { background: #3b82f6; }
        .update-btn.btn-updated:hover:not(:disabled) { background: #2563eb; }
        .update-btn.btn-retracted { background: #d97706; }
        .update-btn.btn-retracted:hover:not(:disabled) { background: #b45309; }
        .update-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .connect-prompt {
          text-align: center; padding: 1.5rem;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; font-size: 0.82rem; color: rgba(255,255,255,0.4);
        }

        .not-owner-box {
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 12px; padding: 1.25rem; text-align: center; margin-bottom: 1.5rem;
        }
        .not-owner-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .not-owner-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem; color: #f87171; margin-bottom: 0.3rem; }
        .not-owner-desc { font-size: 0.78rem; color: rgba(255,255,255,0.4); line-height: 1.5; }

        .done-box {
          text-align: center; padding: 3rem 1.5rem;
          background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); border-radius: 16px;
        }
        .done-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .done-title { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem; }
        .done-sub { font-size: 0.82rem; color: rgba(255,255,255,0.4); margin-bottom: 1.5rem; line-height: 1.6; }
        .tx-link { display: inline-block; font-size: 0.72rem; color: #F97316; word-break: break-all; text-decoration: none; margin-bottom: 1.5rem; }
        .tx-link:hover { text-decoration: underline; }

        .btn-again {
          background: transparent; color: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 999px;
          padding: 0.5rem 1.3rem; font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem; cursor: pointer; transition: background .2s;
        }
        .btn-again:hover { background: rgba(255,255,255,0.07); }

        .error-box {
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px; padding: 0.9rem 1rem; margin-bottom: 1rem;
          font-size: 0.8rem; color: #f87171;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; margin-right: 6px;
        }
      `}</style>

      <div className="page">
        <div className="glow-br" />
        <nav className="nav">
          <Link href="/" className="logo"><span className="logo-dot" />ProvenanceChain</Link>
          <Link href="/" className="back">← Back</Link>
          <WalletMultiButton />
        </nav>

        <div className="body">
          <h1 className="page-title">Manage Status</h1>
          <p className="page-sub">
            Update or retract a previously recorded document. Upload the original PDF to locate it on-chain, then choose a new status. Only the original submitter can modify a record.
          </p>

          {step === 'done' ? (
            <div className="done-box">
              <div className="done-icon">✅</div>
              <div className="done-title">Status Updated</div>
              <p className="done-sub">
                The document status has been changed to <strong>{newStatus}</strong> on the Solana blockchain.
              </p>
              <a className="tx-link" href={`https://solscan.io/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer">
                View on Solscan →
              </a>
              <br />
              <button className="btn-again" onClick={reset}>Manage Another</button>
            </div>
          ) : (
            <>
              {/* Hidden file input */}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={onChange}
              />

              {!file ? (
                <div
                  className={`drop ${dragging ? 'dragging' : ''}`}
                  onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => inputRef.current?.click()}
                >
                  <div className="drop-icon">🔄</div>
                  <p className="drop-label">
                    <span>Upload the original PDF</span> to locate it on-chain<br />PDF files only
                  </p>
                </div>
              ) : (
                <>
                  <div className="file-pill">
                    <span className="file-name">📄 {file.name}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="hash-box">
                    <div className="hash-label">SHA-256 Hash</div>
                    {step === 'hashing'
                      ? <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>Computing hash…</div>
                      : <div className="hash-value">{hash}</div>
                    }
                  </div>
                </>
              )}

              {step === 'fetching' && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                  <span className="spinner" />Querying blockchain…
                </div>
              )}

              {step === 'error' && (
                <div className="error-box">{error}</div>
              )}
              {step === 'error' && (
                <button className="btn-again" onClick={reset} style={{ marginBottom: '1rem' }}>Try Again</button>
              )}

              {(step === 'ready' || step === 'submitting') && record && (
                <>
                  {/* Document details card */}
                  <div className="record-card">
                    <div className="record-header">Document Found</div>
                    <div className="meta">
                      <div className="meta-row">
                        <span className="meta-key">Title</span>
                        <span className="meta-val">{record.title}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-key">Authors</span>
                        <span className="meta-val">{record.authors.join(', ')}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-key">Committed</span>
                        <span className="meta-val">{fmt(record.timestamp)}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-key">Current Status</span>
                        <span className="meta-val" style={{ color: statusColor(record.status) }}>{record.status}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-key">Owner</span>
                        <span className="meta-val" style={{ fontSize: '0.68rem', fontFamily: "'Courier New', monospace" }}>
                          {record.owner.slice(0, 8)}…{record.owner.slice(-6)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ownership check */}
                  {notOwner ? (
                    <div className="not-owner-box">
                      <div className="not-owner-icon">🔒</div>
                      <div className="not-owner-title">Not Authorized</div>
                      <p className="not-owner-desc">
                        Your connected wallet does not match the owner of this document. Only the original submitter can update the status.
                      </p>
                    </div>
                  ) : !connected ? (
                    <div className="connect-prompt">
                      Connect your wallet to update status
                      <div style={{ marginTop: '0.75rem' }}><WalletMultiButton /></div>
                    </div>
                  ) : (
                    <>
                      {/* Status selection */}
                      <div className="status-section">
                        <span className="status-label">Select new status</span>
                        <div className="status-options">
                          <div
                            className={`status-opt ${newStatus === 'Updated' ? 'selected-updated' : ''}`}
                            onClick={() => setNewStatus('Updated')}
                          >
                            <div className="status-opt-icon">📝</div>
                            <div className={`status-opt-name ${newStatus === 'Updated' ? 'blue' : ''}`}>Updated</div>
                            <div className="status-opt-desc">Mark this document as having a newer version available</div>
                          </div>
                          <div
                            className={`status-opt ${newStatus === 'Retracted' ? 'selected-retracted' : ''}`}
                            onClick={() => setNewStatus('Retracted')}
                          >
                            <div className="status-opt-icon">⚠️</div>
                            <div className={`status-opt-name ${newStatus === 'Retracted' ? 'yellow' : ''}`}>Retracted</div>
                            <div className="status-opt-desc">Formally withdraw this document from the record</div>
                          </div>
                        </div>
                      </div>

                      <button
                        className={`update-btn ${newStatus === 'Updated' ? 'btn-updated' : 'btn-retracted'}`}
                        onClick={handleUpdate}
                        disabled={step === 'submitting'}
                      >
                        {step === 'submitting'
                          ? <><span className="spinner" />Updating on Solana…</>
                          : newStatus === 'Retracted'
                            ? 'Retract Document'
                            : 'Mark as Updated'
                        }
                      </button>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
