'use client';

import { useState, useEffect, useRef } from 'react';

// Debug Panel Component
function DebugPanel({ editData, locais, falhas, subcategorias, device }) {
  const [expanded, setExpanded] = useState(true);

  const selectedLocal = locais.find(l => String(l.id) === String(editData.local_id));
  const selectedFalha = falhas.find(f => String(f.id) === String(editData.falha_id));
  const selectedSub = subcategorias.find(s => String(s.id) === String(editData.subcategoria_id));

  const mismatches = [];
  if (editData.local_id && !selectedLocal) {
    mismatches.push({ field: 'Local/Canal', value: editData.local_id, issue: 'ID não encontrado na lista de locais' });
  }
  if (editData.equipamento_nome && editData.equipamento_nome.length < 2) {
    mismatches.push({ field: 'Equipamento', value: editData.equipamento_nome, issue: 'Nome muito curto' });
  }
  if (editData.falha_id && !selectedFalha) {
    mismatches.push({ field: 'Falha', value: editData.falha_id, issue: 'ID não encontrado na lista de falhas' });
  }
  if (editData.subcategoria_id && !selectedSub) {
    mismatches.push({ field: 'Subcategoria', value: editData.subcategoria_id, issue: 'ID não encontrado' });
  }

  return (
    <div style={{
      margin: '12px',
      padding: '12px',
      background: mismatches.length > 0 ? '#FFFBEB' : '#F0F9FF',
      border: `1px solid ${mismatches.length > 0 ? '#FCD34D' : '#BAE6FD'}`,
      borderRadius: 8,
      fontSize: 12,
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: mismatches.length > 0 ? '#D97706' : '#0369A1' }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          Debug - Dados Selecionados
          {mismatches.length > 0 && (
            <span style={{ background: '#FEF3C7', color: '#D97706', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>
              {mismatches.length} alerta
            </span>
          )}
        </div>
        <span style={{ color: '#94A3B8' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {/* Device Info */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, color: '#64748B', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>
              Dispositivo (do sistema)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>PC Name</div>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{device?.pcName || '-'}</div>
              </div>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>Canal</div>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{device?.canal || '-'}</div>
              </div>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>IP</div>
                <div style={{ fontWeight: 500, fontSize: 11, fontFamily: 'monospace' }}>{device?.ip || '-'}</div>
              </div>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>Serial</div>
                <div style={{ fontWeight: 500, fontSize: 11, fontFamily: 'monospace' }}>{device?.serial || '-'}</div>
              </div>
            </div>
          </div>

          {/* AI Selected Values */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, color: '#64748B', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>
              Valores Selecionados pela IA
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>ID Local</div>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{editData.local_id || '-'}</div>
              </div>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>Nome Local</div>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{selectedLocal?.nome || editData.local_nome || '-'}</div>
              </div>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>Equipamento</div>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{editData.equipamento_nome || '-'}</div>
              </div>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>ID Falha</div>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{editData.falha_id || '-'}</div>
              </div>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>Nome Falha</div>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{selectedFalha?.descricao || editData.falha_nome || '-'}</div>
              </div>
              <div style={{ padding: 4, background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                <div style={{ color: '#94A3B8', fontSize: 9 }}>ID Subcategoria</div>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{editData.subcategoria_id || '-'}</div>
              </div>
            </div>
          </div>

          {/* Mismatches */}
          {mismatches.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: '#D97706', fontSize: 10, textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                ⚠️ Alertas
              </div>
              {mismatches.map((m, idx) => (
                <div key={idx} style={{ padding: 4, background: '#FEF3C7', borderRadius: 4, border: '1px solid #FCD34D', fontSize: 10, marginBottom: 2 }}>
                  <strong>{m.field}:</strong> {m.value} - {m.issue}
                </div>
              ))}
            </div>
          )}

          {/* JSON Payload */}
          <div>
            <div style={{ fontWeight: 600, color: '#64748B', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>
              Payload que será enviado
            </div>
            <pre style={{
              padding: 6,
              background: '#1E293B',
              color: '#E2E8F0',
              borderRadius: 4,
              fontSize: 9,
              overflow: 'auto',
              maxHeight: 80,
              fontFamily: 'monospace',
              margin: 0,
            }}>
              {JSON.stringify({
                local_id: editData.local_id,
                equipamento_nome: editData.equipamento_nome,
                falha_id: editData.falha_id,
                subcategoria_id: editData.subcategoria_id,
                horas_paradas: editData.horas_paradas,
                recursos_parados: editData.recursos_parados,
                comentario: editData.comentario,
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModalApontamentoOffline({ device, onClose, onSuccess }) {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const chatEndRef = useRef(null);

  // Apontamento state
  const [campos, setCampos] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  // Data from API
  const [locais, setLocais] = useState([]);
  const [falhas, setFalhas] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Calcular horas paradas
  const calcularHorasParadas = () => {
    if (!device?.ultimoSync) return 'N/A';
    try {
      const [dataPart, horaPart] = device.ultimoSync.split(' ');
      const [dia, mes, ano] = dataPart.split('/');
      const ultimoSync = new Date(`${ano}-${mes}-${dia}T${horaPart || '00:00'}`);
      const agora = new Date();
      const diffMs = agora - ultimoSync;
      const diffHoras = diffMs / (1000 * 60 * 60);
      const horas = Math.floor(diffHoras);
      const minutos = Math.floor((diffHoras - horas) * 60);
      if (horas > 24) {
        const dias = Math.floor(horas / 24);
        return `${dias}d ${horas % 24}h ${minutos}min`;
      }
      return `${horas}h ${minutos}min`;
    } catch {
      return 'N/A';
    }
  };

  const horasParadas = calcularHorasParadas();

  // Calcular horas em decimal para envio
  const calcularHorasDecimal = () => {
    if (!device?.ultimoSync) return 0.1;
    try {
      const [dataPart, horaPart] = device.ultimoSync.split(' ');
      const [dia, mes, ano] = dataPart.split('/');
      const ultimoSync = new Date(`${ano}-${mes}-${dia}T${horaPart || '00:00'}`);
      const agora = new Date();
      const diffMs = agora - ultimoSync;
      return Math.max(0.1, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
    } catch {
      return 0.1;
    }
  };

  // Buscar locais e falhas
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/apontamentos?action=completo');
        if (res.ok) {
          const data = await res.json();
          setLocais(data.locais || []);
          setFalhas(data.falhas || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Buscar subcategorias quando falha muda
  useEffect(() => {
    if (!editData.falha_id) {
      setSubcategorias([]);
      return;
    }
    async function loadSubcategorias() {
      try {
        const res = await fetch(`/api/apontamentos?action=subcategorias&falhaId=${editData.falha_id}`);
        if (res.ok) {
          const data = await res.json();
          setSubcategorias(Array.isArray(data) ? data : data.subcategorias || []);
        }
      } catch (err) {
        console.error('Erro ao carregar subcategorias:', err);
      }
    }
    loadSubcategorias();
  }, [editData.falha_id]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gerar session ID
  const generateSessionId = () => 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Enviar mensagem para chat IA
  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setSending(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    const currentSessionId = sessionId || generateSessionId();
    if (!sessionId) setSessionId(currentSessionId);

    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          sessaoId: currentSessionId,
          mensagem: `${userMessage} (Dispositivo: ${device.pcName}, Canal: ${device.canal}, IP: ${device.ip}, Horas paradas: ${horasParadas}, Recursos afetados: 1)`,
        }),
      });

      const data = await res.json();

      if (data.tipo === 'confirmacao') {
        // Auto-correct local based on device canal
        let camposCorrigidos = { ...data.campos };
        const canalDevice = device.canal?.replace(/\D/g, ''); // Extract numbers from canal (e.g., "CH9" -> "9")

        if (canalDevice && locais.length > 0) {
          // Find local that matches the canal number
          const localCorreto = locais.find(l => {
            const nomeLocal = l.nome?.toLowerCase() || '';
            return nomeLocal.includes(canalDevice);
          });

          if (localCorreto && String(localCorreto.id) !== String(camposCorrigidos.local_id)) {
            console.log(`[Debug] Auto-correção: local_id ${camposCorrigidos.local_id} -> ${localCorreto.id} (canal ${canalDevice})`);
            camposCorrigidos.local_id = localCorreto.id;
            camposCorrigidos.local_nome = localCorreto.nome;
          }
        }

        // Default equipment to "Mini PC" if not specified by user
        if (!camposCorrigidos.equipamento_nome || camposCorrigidos.equipamento_nome === device.pcName) {
          camposCorrigidos.equipamento_nome = 'Mini PC';
        }

        setCampos(camposCorrigidos);
        setEditData({
          ...camposCorrigidos,
          canal: device.canal,
          horas_paradas: calcularHorasDecimal(),
        });

        // Build correction note if local was auto-corrected
        let correctionNote = '';
        if (canalDevice && locais.length > 0) {
          const localCorreto = locais.find(l => {
            const nomeLocal = l.nome?.toLowerCase() || '';
            return nomeLocal.includes(canalDevice);
          });
          if (localCorreto && String(localCorreto.id) !== String(data.campos.local_id)) {
            correctionNote = `\n\n✅ Local auto-corrigido: ${data.campos.local_nome} → ${localCorreto.nome} (baseado no canal ${device.canal})`;
          }
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.mensagem + correctionNote,
          isConfirmation: true,
          campos: camposCorrigidos,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.mensagem || data.error || 'Erro ao processar mensagem',
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro ao conectar com a IA. Tente novamente.',
        isError: true,
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Atualizar campo editado
  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Reset chat
  const handleReset = async () => {
    if (sessionId) {
      await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', sessaoId: sessionId }),
      });
    }
    setMessages([]);
    setCampos(null);
    setEditData({});
    setEditMode(false);
    setSessionId(null);
  };

  // Submeter apontamento
  const handleSubmit = async () => {
    if (!editData.local_id || !editData.equipamento_nome || !editData.falha_id) {
      setError('Campos obrigatórios faltando');
      return;
    }

    setSubmitting(true);
    setError(null);

    const local = locais.find(l => l.id === Number(editData.local_id));
    const falha = falhas.find(f => f.id === Number(editData.falha_id));
    const sub = subcategorias.find(s => s.id === Number(editData.subcategoria_id));

    try {
      // 1. Registrar no site local
      await fetch('/api/apontamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipamento_nome: editData.equipamento_nome,
          local_id: Number(editData.local_id),
          falha_id: Number(editData.falha_id),
          subcategoria_id: editData.subcategoria_id ? Number(editData.subcategoria_id) : undefined,
          horas_paradas: editData.horas_paradas || calcularHorasDecimal(),
          recursos_parados: Number(editData.recursos_parados) || 1,
          comentario: editData.comentario || '',
        }),
      });

      // 2. Registrar no Notion
      await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Desvio: ${device.pcName} - ${local?.nome || device.canal}`,
          details: [
            `Canal: ${device.canal}`,
            `Equipamento: ${device.pcName}`,
            `IP: ${device.ip}`,
            `Serial: ${device.serial || 'N/A'}`,
            `Último Sync: ${device.ultimoSync || 'N/A'}`,
            `Horas Paradas: ${editData.horas_paradas || horasParadas}`,
            `Local: ${local?.nome || 'N/A'}`,
            `Falha: ${falha?.descricao || falha?.nome || 'N/A'}`,
            sub ? `Subcategoria: ${sub.descricao || sub.nome}` : null,
            `Recursos Parados: ${editData.recursos_parados || 1}`,
            `Data: ${new Date().toLocaleDateString('pt-BR')}`,
            editData.comentario ? `Ação: ${editData.comentario}` : null,
          ].filter(Boolean).join('\n'),
          status: 'Concluido',
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError('Erro ao registrar apontamento');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset e fechar
  const handleClose = async () => {
    await handleReset();
    onClose();
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Apontamento Registrado!</h3>
          <p className="text-sm text-gray-500">Dispositivo registrado no site local e no Notion.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Apontar Dispositivo Offline</h2>
            <p className="text-sm text-gray-500">Descreva o problema e a IA coletará os dados. Você pode editar antes de enviar.</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dados do Dispositivo */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">PC Name</span>
              <p className="font-medium text-gray-900">{device.pcName}</p>
            </div>
            <div>
              <span className="text-gray-500">Canal</span>
              <p className="font-medium text-gray-900">{device.canal}</p>
            </div>
            <div>
              <span className="text-gray-500">IP</span>
              <p className="font-medium text-gray-900 font-mono text-xs">{device.ip}</p>
            </div>
            <div>
              <span className="text-gray-500">Horas Paradas</span>
              <p className="font-bold text-red-600">{horasParadas}</p>
            </div>
          </div>
        </div>

        {/* Conteúdo principal - 2 colunas */}
        <div className="flex-1 overflow-hidden flex">
          {/* Chat */}
          <div className="flex-1 flex flex-col border-r border-gray-200">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-medium text-gray-500 uppercase">Chat com IA</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 350 }}>
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">💬</div>
                  <div className="text-sm">Descreva o problema do dispositivo</div>
                  <div className="text-xs mt-1">Ex: "PC ficou offline por problema de rede, cabo danificado"</div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.isConfirmation && msg.campos && (
                        <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600 border border-gray-200">
                          <div className="font-medium text-gray-700 mb-1">Dados coletados:</div>
                          <div>Local: {msg.campos.local_nome}</div>
                          <div>Falha: {msg.campos.falha_nome}</div>
                          <div>Horas: {msg.campos.horas_paradas}h</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Descreva o problema..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={sending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="w-80 flex flex-col overflow-y-auto">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase">Dados do Apontamento</span>
              {campos && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {editMode ? 'Concluir' : 'Editar'}
                </button>
              )}
            </div>
            <div className="flex-1 p-4 space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-xs">
                  {error}
                </div>
              )}

              {/* Debug Panel */}
              {campos && (
                <DebugPanel
                  editData={editData}
                  locais={locais}
                  falhas={falhas}
                  subcategorias={subcategorias}
                  device={device}
                />
              )}

              {!campos ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <div className="text-2xl mb-2">📝</div>
                  <div>Aguardando dados da IA...</div>
                </div>
              ) : (
                <>
                  {/* Local */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Local *</label>
                    {editMode ? (
                      <select
                        value={editData.local_id || ''}
                        onChange={(e) => handleEditChange('local_id', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Selecione</option>
                        {locais.map(l => (
                          <option key={l.id} value={l.id}>{l.nome}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm font-medium">{campos.local_nome}</div>
                    )}
                  </div>

                  {/* Canal - auto preenchido */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Canal</label>
                    <div className="text-sm font-medium px-2 py-1.5 bg-gray-100 rounded">{device.canal}</div>
                  </div>

                  {/* Falha */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Falha *</label>
                    {editMode ? (
                      <select
                        value={editData.falha_id || ''}
                        onChange={(e) => handleEditChange('falha_id', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Selecione</option>
                        {falhas.map(f => (
                          <option key={f.id} value={f.id}>{f.descricao || f.nome}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm font-medium">{campos.falha_nome}</div>
                    )}
                  </div>

                  {/* Subcategoria */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Subcategoria</label>
                    {editMode ? (
                      <select
                        value={editData.subcategoria_id || ''}
                        onChange={(e) => handleEditChange('subcategoria_id', e.target.value)}
                        disabled={!editData.falha_id}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      >
                        <option value="">Selecione</option>
                        {subcategorias.map(s => (
                          <option key={s.id} value={s.id}>{s.descricao || s.nome}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm font-medium">{campos.subcategoria_nome || 'N/A'}</div>
                    )}
                  </div>

                  {/* Horas Paradas */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Horas Paradas</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editData.horas_paradas || calcularHorasDecimal()}
                        onChange={(e) => handleEditChange('horas_paradas', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-sm font-bold text-red-600 px-2 py-1.5 bg-red-50 rounded">{horasParadas}</div>
                    )}
                  </div>

                  {/* Recursos */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Recursos Parados</label>
                    {editMode ? (
                      <input
                        type="number"
                        min="1"
                        value={editData.recursos_parados || 1}
                        onChange={(e) => handleEditChange('recursos_parados', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-sm font-medium">{campos.recursos_parados || 1}</div>
                    )}
                  </div>

                  {/* Comentário */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ação / Comentário</label>
                    {editMode ? (
                      <textarea
                        value={editData.comentario || ''}
                        onChange={(e) => handleEditChange('comentario', e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm resize-none"
                      />
                    ) : (
                      <div className="text-sm text-gray-600">{campos.comentario}</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Botões */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              {campos && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Registrando...' : 'Registrar Apontamento'}
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                Nova Conversa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
