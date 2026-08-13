'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PainelOffline() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', canal: 'all' });

  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch('/api/auth/painel');
        if (!res.ok) {
          router.replace('/painel/login');
          return;
        }
      } catch {
        router.replace('/painel/login');
        return;
      }
      setChecking(false);
    }
    verifyAuth();
  }, [router]);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/smart-monitor');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDevices(data.devices || []);
      }
    } catch (err) {
      setError('Erro ao conectar com Smart Monitor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (checking) return;
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [checking, fetchDevices]);

  const filteredDevices = devices.filter(device => {
    if (filters.status !== 'all' && device.status !== filters.status) return false;
    if (filters.canal !== 'all' && device.canal !== filters.canal) return false;
    return true;
  });

  const canals = [...new Set(devices.map(d => d.canal))].sort();

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Verificando acesso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/painel" className="text-sm text-gray-500 hover:text-gray-700">
                ← Voltar
              </Link>
              <span className="text-xl font-bold text-gray-800">Dispositivos Offline</span>
            </div>
            <button
              onClick={fetchDevices}
              disabled={loading}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Atualizar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">Total</div>
              <div className="text-2xl font-bold text-gray-900">{devices.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">Online</div>
              <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">Offline</div>
              <div className="text-2xl font-bold text-red-600">{offlineCount}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="all">Todos</option>
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Canal</label>
                <select
                  value={filters.canal}
                  onChange={(e) => setFilters(prev => ({ ...prev, canal: e.target.value }))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="all">Todos</option>
                  {canals.map(canal => (
                    <option key={canal} value={canal}>{canal}</option>
                  ))}
                </select>
              </div>
              <div className="ml-auto text-sm text-gray-500">
                {filteredDevices.length} dispositivo(s)
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Devices Table */}
          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            {loading && devices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Carregando dispositivos...</div>
            ) : filteredDevices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {error ? 'Verifique a conexão com o Smart Monitor' : 'Nenhum dispositivo encontrado'}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PC Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MAC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Canal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RAM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disco
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Sync
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDevices.map((device) => (
                    <tr key={device.serial || device.ip} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{device.pcName}</div>
                        <div className="text-xs text-gray-400">{device.serial || device.hostname}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {device.ip}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 font-mono">
                        {device.mac || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {device.canal}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {device.ram !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${device.ram > 80 ? 'bg-red-500' : device.ram > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(device.ram, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-gray-600">{device.ram}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {device.disco !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${device.disco > 80 ? 'bg-red-500' : device.disco > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(device.disco, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-gray-600">{device.disco}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {device.ultimoSync || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          device.status === 'online'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {device.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {device.href && (
                          <a
                            href={device.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Detalhes →
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
