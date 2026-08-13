'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_STYLES = {
  'Concluído': 'bg-green-50 text-green-700',
  'Em Andamento': 'bg-blue-50 text-blue-700',
  'Pendente': 'bg-yellow-50 text-yellow-700',
  'Cancelado': 'bg-red-50 text-red-700',
};

export default function PainelApontamentos() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

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

  useEffect(() => {
    if (checking) return;

    async function loadPages() {
      setLoading(true);
      try {
        const res = await fetch('/api/notion');
        const data = await res.json();
        if (!data.error) {
          setPages(data.pages || []);
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPages();
  }, [checking]);

  const filteredPages = filter === 'Todos'
    ? pages
    : pages.filter(p => p.status === filter);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
              <span className="text-xl font-bold text-gray-800">Apontamentos</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['Todos', 'Pendente', 'Em Andamento', 'Concluído', 'Cancelado'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Carregando...</div>
            ) : filteredPages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhum apontamento encontrado</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalhes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {page.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {page.details || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[page.status] || 'bg-gray-100 text-gray-700'}`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(page.createdTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Stats */}
          {!loading && pages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="text-xs font-medium text-gray-500 uppercase">Total</div>
                <div className="text-2xl font-bold text-gray-900">{pages.length}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="text-xs font-medium text-gray-500 uppercase">Pendentes</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {pages.filter(p => p.status === 'Pendente').length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="text-xs font-medium text-gray-500 uppercase">Em Andamento</div>
                <div className="text-2xl font-bold text-blue-600">
                  {pages.filter(p => p.status === 'Em Andamento').length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="text-xs font-medium text-gray-500 uppercase">Concluídos</div>
                <div className="text-2xl font-bold text-green-600">
                  {pages.filter(p => p.status === 'Concluído').length}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
