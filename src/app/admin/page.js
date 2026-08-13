'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { StatCard, Card, Badge, Button, LoadingSpinner } from '@/components/ui';

// Icons
const ComputerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
  </svg>
);

const WifiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);

const WifiOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c1.418-1.418 3.185-2.34 5.094-2.765m-2.428-2.428A13.5 13.5 0 0119.93 9.143M1.924 8.674c2.143-2.144 4.885-3.568 7.938-3.934M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);

const NotionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
  </svg>
);

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, unknown: 0 });
  const [notionCount, setNotionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const [monitorRes, notionRes] = await Promise.all([
        fetch('/api/smart-monitor?all=true'),
        fetch('/api/notion').catch(() => null),
      ]);

      if (monitorRes.ok) {
        const data = await monitorRes.json();
        setDevices(data.allDevices || []);
        setStats({
          total: data.total || 0,
          online: data.online || 0,
          offline: data.offline || 0,
          unknown: data.unknown || 0,
        });
      }

      if (notionRes && notionRes.ok) {
        const notionData = await notionRes.json();
        setNotionCount(notionData.pages?.length || 0);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Agrupar dispositivos por canal
  const devicesByCanal = devices.reduce((acc, d) => {
    if (!acc[d.canal]) acc[d.canal] = { total: 0, offline: 0 };
    acc[d.canal].total++;
    if (d.status === 'offline') acc[d.canal].offline++;
    return acc;
  }, {});

  const sortedCanals = Object.entries(devicesByCanal)
    .sort((a, b) => b[1].offline - a[1].offline);

  // Top 10 offline
  const offlineDevices = devices
    .filter(d => d.status === 'offline')
    .sort((a, b) => {
      if (!a.ultimoSync) return 1;
      if (!b.ultimoSync) return -1;
      const parseDate = (s) => {
        const [d, m, y] = s.split(' ')[0].split('/');
        return new Date(`${y}-${m}-${d}T${s.split(' ')[1] || '00:00'}`);
      };
      return parseDate(a.ultimoSync) - parseDate(b.ultimoSync);
    })
    .slice(0, 10);

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <LoadingSpinner />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Visão geral do sistema de apontamentos
              {lastUpdate && (
                <span style={{ marginLeft: 8, color: 'var(--n-400)', fontSize: 12 }}>
                  · Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={fetchData}>
              <RefreshIcon />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid-stats">
          <StatCard
            label="Total Dispositivos"
            value={stats.total}
            icon={<ComputerIcon />}
          />
          <StatCard
            label="PCs Online"
            value={stats.online}
            icon={<WifiIcon />}
          />
          <StatCard
            label="PCs Offline"
            value={stats.offline}
            icon={<WifiOffIcon />}
          />
          <StatCard
            label="Apontamentos Notion"
            value={notionCount}
            icon={<NotionIcon />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid-2col">
          {/* Distribuição por Canal */}
          <Card title="Distribuição por Canal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedCanals.length > 0 ? (
                sortedCanals.map(([canal, data]) => {
                  const onlinePct = data.total > 0 ? ((data.total - data.offline) / data.total) * 100 : 0;
                  const offlinePct = data.total > 0 ? (data.offline / data.total) * 100 : 0;
                  return (
                    <div key={canal} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--n-700)', minWidth: 100 }}>{canal}</span>
                      <div style={{ flex: 1, height: 24, background: 'var(--n-100)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                        <div
                          style={{ background: '#22c55e', height: '100%', transition: 'width 0.3s', width: `${onlinePct}%` }}
                          title={`${data.total - data.offline} online`}
                        />
                        <div
                          style={{ background: '#ef4444', height: '100%', transition: 'width 0.3s', width: `${offlinePct}%` }}
                          title={`${data.offline} offline`}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--n-500)', minWidth: 60, textAlign: 'right' }}>
                        {data.total - data.offline}/{data.total}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--n-500)', fontSize: 13 }}>
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </Card>

          {/* Dispositivos Offline */}
          <Card
            title="Dispositivos Offline"
            action={
              <a href="/admin/offline" style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none' }}>
                Ver todos →
              </a>
            }
          >
            {offlineDevices.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--n-200)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--n-500)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>PC Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--n-500)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Canal</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--n-500)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Último Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offlineDevices.map((device, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--n-100)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--n-900)' }}>{device.pcName}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                            {device.canal}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--n-500)', fontSize: 12 }}>{device.ultimoSync || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--n-500)' }}>
                <CheckIcon />
                <div style={{ marginTop: 8, fontSize: 13 }}>Nenhum dispositivo offline no momento</div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
