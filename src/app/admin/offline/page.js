'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ModalApontamentoOffline from '@/components/ModalApontamentoOffline';

// --- Icons ---
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
  </svg>
);

const WifiOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c1.418-1.418 3.185-2.34 5.094-2.765m-2.428-2.428A13.5 13.5 0 0119.93 9.143M1.924 8.674c2.143-2.144 4.885-3.568 7.938-3.934M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);

const ComputerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

// Status Badge Component
function StatusBadge({ status }) {
  const styles = {
    offline: { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', label: 'Offline' },
    online: { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', label: 'Online' },
    unknown: { background: 'rgba(234,179,8,0.12)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)', label: 'Desconhecido' },
  };
  const s = styles[status] || styles.unknown;
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      background: s.background,
      color: s.color,
      border: s.border,
    }}>
      {s.label}
    </span>
  );
}

// Stat Card
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'var(--n-800, #1e293b)',
      border: '1px solid var(--n-700, #334155)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: color + '22',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function OfflinePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/smart-monitor${showAll ? '?all=true' : ''}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (e) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [showAll]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [showAll]);

  const devices = data?.devices || [];

  // Get unique channels for filter
  const channels = ['all', ...new Set(devices.map(d => d.canal).filter(Boolean))].sort((a, b) =>
    a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b)
  );

  // Filter devices
  const filtered = devices.filter(d => {
    const matchesSearch = !search ||
      d.pcName?.toLowerCase().includes(search.toLowerCase()) ||
      d.ip?.includes(search) ||
      d.serial?.toLowerCase().includes(search.toLowerCase()) ||
      d.canal?.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = channelFilter === 'all' || d.canal === channelFilter;
    return matchesSearch && matchesChannel;
  });

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ background: '#0f172a', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Dispositivos Offline</h1>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
              Monitoramento em tempo real via Smart Monitor
              {lastUpdated && (
                <span style={{ marginLeft: 8, color: '#475569' }}>
                  · Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setShowAll(v => !v)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: showAll ? 'rgba(59,130,246,0.15)' : '#1e293b',
                color: showAll ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {showAll ? 'Ver Offline' : 'Ver Todos'}
            </button>
            <button
              id="btn-refresh-offline"
              onClick={fetchData}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#1e293b',
                color: loading ? '#475569' : '#94a3b8',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>
                <RefreshIcon />
              </span>
              Atualizar
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total de Dispositivos" value={data.total} color="#60a5fa" icon={<ComputerIcon />} />
            <StatCard label="Offline" value={data.offline} color="#f87171" icon={<WifiOffIcon />} />
            <StatCard
              label="Online"
              value={data.online}
              color="#34d399"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                </svg>
              }
            />
            <StatCard label="Exibindo" value={filtered.length} color="#a78bfa" icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
              </svg>
            } />
          </div>
        )}

        {/* Search + Channel Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
              <SearchIcon />
            </span>
            <input
              id="search-devices"
              type="text"
              placeholder="Buscar PC, IP, Serial ou Canal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#e2e8f0',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Channel buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {channels.map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 99,
                  border: '1px solid',
                  borderColor: channelFilter === ch ? '#3b82f6' : '#334155',
                  background: channelFilter === ch ? 'rgba(59,130,246,0.15)' : '#1e293b',
                  color: channelFilter === ch ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {ch === 'all' ? 'Todos' : ch}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading && !data ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#475569' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13 }}>Conectando ao Smart Monitor...</div>
            </div>
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10,
            padding: '20px 24px',
            color: '#fca5a5',
          }}>
            <strong>Erro:</strong> {error}
            <button
              onClick={fetchData}
              style={{ marginLeft: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
            >
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 10,
            padding: '48px 24px',
            textAlign: 'center',
            color: '#475569',
          }}>
            <div style={{ marginBottom: 8 }}>
              <WifiOffIcon />
            </div>
            {search || channelFilter !== 'all'
              ? 'Nenhum dispositivo encontrado para os filtros atuais.'
              : showAll
                ? 'Nenhum dispositivo encontrado.'
                : '✅ Nenhum dispositivo offline no momento!'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {['PC / Hostname', 'IP', 'MAC', 'Canal', 'RAM', 'Disco', 'Status', 'Último Sync', 'Ação'].map(col => (
                    <th key={col} style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: '#0f172a',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((device, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{device.pcName}</div>
                      {device.serial && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                          {device.serial}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8', fontSize: 12 }}>
                      {device.ip}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8', fontSize: 11 }}>
                      {device.mac || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: '#1e3a5f',
                        color: '#60a5fa',
                        padding: '2px 10px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                        {device.canal}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {device.ram !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, background: '#334155', borderRadius: 4, height: 6 }}>
                            <div style={{
                              width: `${Math.min(device.ram, 100)}%`,
                              height: '100%',
                              borderRadius: 4,
                              background: device.ram > 80 ? '#ef4444' : device.ram > 60 ? '#f59e0b' : '#3b82f6',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
                            {device.ram}%
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#64748b' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {device.disco !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, background: '#334155', borderRadius: 4, height: 6 }}>
                            <div style={{
                              width: `${Math.min(device.disco, 100)}%`,
                              height: '100%',
                              borderRadius: 4,
                              background: device.disco > 80 ? '#ef4444' : device.disco > 60 ? '#f59e0b' : '#3b82f6',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
                            {device.disco}%
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#64748b' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={device.status} />
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: 12 }}>
                      {device.ultimoSync || '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedDevice(device)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: device.status === 'online' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(251,191,36,0.3)',
                            background: device.status === 'online' ? 'rgba(59,130,246,0.12)' : 'rgba(251,191,36,0.12)',
                            color: device.status === 'online' ? '#60a5fa' : '#fbbf24',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Apontar
                        </button>
                        {device.href && (
                          <a
                            href={device.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#60a5fa',
                              fontSize: 12,
                              textDecoration: 'none',
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(59,130,246,0.3)',
                              background: 'rgba(59,130,246,0.08)',
                            }}
                          >
                            <ExternalLinkIcon />
                            Ver
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Spinner animation */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </main>

      {/* Modal de Apontamento */}
      {selectedDevice && (
        <ModalApontamentoOffline
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onSuccess={() => {
            fetchData();
            setSelectedDevice(null);
          }}
        />
      )}
    </>
  );
}
