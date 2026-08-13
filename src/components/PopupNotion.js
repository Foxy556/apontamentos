'use client';

import { useState } from 'react';

export default function PopupNotion({ campos, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Pedir para a IA melhorar o texto
      const groqRes = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'melhorar-texto-notion',
          campos,
        }),
      });

      if (!groqRes.ok) {
        throw new Error('Erro ao gerar texto para Notion');
      }

      const groqData = await groqRes.json();

      // 2. Registrar no Notion com o texto melhorado
      const notionRes = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: groqData.titulo || `Desvio: ${campos.equipamento_nome} - ${campos.local_nome}`,
          details: groqData.detalhes || campos.comentario || 'Sem detalhes',
          status: 'Concluido',
        }),
      });

      if (!notionRes.ok) {
        throw new Error('Erro ao registrar no Notion');
      }

      setSuccess(true);
      setTimeout(() => {
        onConfirm?.();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Registrado no Notion!</h3>
          <p className="text-sm text-gray-500">Apontamento criado com sucesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Registrar no Notion</h3>
            <p className="text-sm text-gray-500">Criar apontamento desta atividade?</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-gray-500">Local:</span> <span className="font-medium">{campos.local_nome}</span></div>
            <div><span className="text-gray-500">Equipamento:</span> <span className="font-medium">{campos.equipamento_nome}</span></div>
            <div><span className="text-gray-500">Falha:</span> <span className="font-medium">{campos.falha_nome}</span></div>
            <div><span className="text-gray-500">Horas:</span> <span className="font-medium">{campos.horas_paradas}h</span></div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          A IA irá melhorar o texto e criar um registro profissional no Notion.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            Não, obrigado
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Sim, criar no Notion'}
          </button>
        </div>
      </div>
    </div>
  );
}
