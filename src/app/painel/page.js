'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Painel() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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

  const handleLogout = async () => {
    await fetch('/api/auth/painel', { method: 'DELETE' });
    window.location.href = '/painel/login';
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
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800">Painel de Visualização</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Apontamentos Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2">
                  Apontamentos
                </h3>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Visualize os registros de apontamentos do Notion.</p>
                  <Link
                    href="/painel/apontamentos"
                    className="mt-4 block w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 px-4 border border-blue-200 rounded-md text-sm font-medium transition-colors text-center"
                  >
                    Ver Apontamentos
                  </Link>
                </div>
              </div>
            </div>

            {/* Atividades Semanais Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2">
                  Atividades Semanais
                </h3>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Visualize as atividades da semana.</p>
                  <Link
                    href="/painel/atividades"
                    className="mt-4 block w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 px-4 border border-blue-200 rounded-md text-sm font-medium transition-colors text-center"
                  >
                    Ver Atividades
                  </Link>
                </div>
              </div>
            </div>

            {/* Dispositivos Offline Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2">
                  Dispositivos Offline
                </h3>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Monitore os dispositivos que estão atualmente sem conexão.</p>
                  <Link
                    href="/painel/offline"
                    className="mt-4 block w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 px-4 border border-blue-200 rounded-md text-sm font-medium transition-colors text-center"
                  >
                    Ver Dispositivos
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
