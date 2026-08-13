'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card, Button, Badge, LoadingSpinner } from '@/components/ui';
import PopupNotion from '@/components/PopupNotion';

// Icons
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const NotionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
  </svg>
);

const WifiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const DebugIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

// Generate unique session ID
function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Debug Panel Component
function DebugPanel({ editData, locais, falhas, subcategorias, userInput }) {
  const [expanded, setExpanded] = useState(true);
  
  // Find the selected items
  const selectedLocal = locais.find(l => String(l.id) === String(editData.local_id));
  const selectedFalha = falhas.find(f => String(f.id) === String(editData.falha_id));
  const selectedSub = subcategorias.find(s => String(s.id) === String(editData.subcategoria_id));
  
  // Check for potential mismatches
  const mismatches = [];
  if (editData.local_id && !selectedLocal) {
    mismatches.push({ field: 'Local/Canal', value: editData.local_id, issue: 'ID não encontrado na lista de locais' });
  }
  if (editData.equipamento_nome && editData.equipamento_nome.length < 2) {
    mismatches.push({ field: 'Equipamento', value: editData.equipamento_nome, issue: 'Nome muito curto, pode estar incorreto' });
  }
  if (editData.falha_id && !selectedFalha) {
    mismatches.push({ field: 'Falha', value: editData.falha_id, issue: 'ID não encontrado na lista de falhas' });
  }
  if (editData.subcategoria_id && !selectedSub) {
    mismatches.push({ field: 'Subcategoria', value: editData.subcategoria_id, issue: 'ID não encontrado na lista de subcategorias' });
  }

  return (
    <Card style={{ marginBottom: 16, border: mismatches.length > 0 ? '2px solid #F59E0B' : '1px solid var(--n-200)' }}>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '4px 0',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DebugIcon />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--n-700)' }}>
            Painel de Debug
          </span>
          {mismatches.length > 0 && (
            <span style={{ 
              background: '#FEF3C7', 
              color: '#D97706', 
              padding: '2px 8px', 
              borderRadius: 10, 
              fontSize: 11, 
              fontWeight: 600 
            }}>
              {mismatches.length} alerta(s)
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'var(--n-400)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, fontSize: 12 }}>
          {/* User Input */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: 'var(--n-500)', marginBottom: 4, textTransform: 'uppercase', fontSize: 10 }}>
              Entrada do Usuário
            </div>
            <div style={{ 
              padding: 8, 
              background: 'var(--n-50)', 
              borderRadius: 4, 
              border: '1px solid var(--n-200)',
              fontFamily: 'monospace',
              fontSize: 11,
            }}>
              {userInput || '(nenhuma mensagem)'}
            </div>
          </div>

          {/* Selected Values */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: 'var(--n-500)', marginBottom: 4, textTransform: 'uppercase', fontSize: 10 }}>
              Valores Selecionados pela IA
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ padding: 6, background: 'var(--n-50)', borderRadius: 4, border: '1px solid var(--n-200)' }}>
                <div style={{ color: 'var(--n-500)', fontSize: 10 }}>ID Local</div>
                <div style={{ fontWeight: 500 }}>{editData.local_id || '-'}</div>
              </div>
              <div style={{ padding: 6, background: 'var(--n-50)', borderRadius: 4, border: '1px solid var(--n-200)' }}>
                <div style={{ color: 'var(--n-500)', fontSize: 10 }}>Nome Local</div>
                <div style={{ fontWeight: 500 }}>{selectedLocal?.nome || editData.local_nome || '-'}</div>
              </div>
              <div style={{ padding: 6, background: 'var(--n-50)', borderRadius: 4, border: '1px solid var(--n-200)' }}>
                <div style={{ color: 'var(--n-500)', fontSize: 10 }}>Equipamento</div>
                <div style={{ fontWeight: 500 }}>{editData.equipamento_nome || '-'}</div>
              </div>
              <div style={{ padding: 6, background: 'var(--n-50)', borderRadius: 4, border: '1px solid var(--n-200)' }}>
                <div style={{ color: 'var(--n-500)', fontSize: 10 }}>ID Falha</div>
                <div style={{ fontWeight: 500 }}>{editData.falha_id || '-'}</div>
              </div>
              <div style={{ padding: 6, background: 'var(--n-50)', borderRadius: 4, border: '1px solid var(--n-200)' }}>
                <div style={{ color: 'var(--n-500)', fontSize: 10 }}>Nome Falha</div>
                <div style={{ fontWeight: 500 }}>{selectedFalha?.descricao || editData.falha_nome || '-'}</div>
              </div>
              <div style={{ padding: 6, background: 'var(--n-50)', borderRadius: 4, border: '1px solid var(--n-200)' }}>
                <div style={{ color: 'var(--n-500)', fontSize: 10 }}>ID Subcategoria</div>
                <div style={{ fontWeight: 500 }}>{editData.subcategoria_id || '-'}</div>
              </div>
            </div>
          </div>

          {/* Mismatches */}
          {mismatches.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: '#D97706', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', fontSize: 10 }}>
                <WarningIcon />
                Alertas de Validação
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {mismatches.map((m, idx) => (
                  <div key={idx} style={{ 
                    padding: 6, 
                    background: '#FFFBEB', 
                    borderRadius: 4, 
                    border: '1px solid #FCD34D',
                    fontSize: 11,
                  }}>
                    <span style={{ fontWeight: 600 }}>{m.field}:</span> {m.value} - {m.issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full JSON Payload */}
          <div>
            <div style={{ fontWeight: 600, color: 'var(--n-500)', marginBottom: 4, textTransform: 'uppercase', fontSize: 10 }}>
              Payload que será enviado
            </div>
            <pre style={{ 
              padding: 8, 
              background: '#1E293B', 
              color: '#E2E8F0', 
              borderRadius: 4, 
              fontSize: 10,
              overflow: 'auto',
              maxHeight: 150,
              fontFamily: 'monospace',
            }}>
              {JSON.stringify({
                local_id: editData.local_id,
                equipamento_nome: editData.equipamento_nome,
                falha_id: editData.falha_id,
                subcategoria_id: editData.subcategoria_id,
                horas_paradas: editData.horas_paradas,
                recursos_parados: editData.recursos_parados,
                comentario: editData.comentario,
                data_ronda: editData.data_ronda,
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ApontamentoDesvios() {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);

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

  // Messages
  const [message, setMessage] = useState(null);

  // Notion popup
  const [showNotionPopup, setShowNotionPopup] = useState(false);
  const [camposForNotion, setCamposForNotion] = useState(null);

  // Debug state
  const [lastUserInput, setLastUserInput] = useState('');
  const [showDebug, setShowDebug] = useState(true);

  // Ref for chat scroll
  const chatEndRef = useRef(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/apontamentos?action=completo');
        const data = await res.json();
        setLocais(data.locais || []);
        setFalhas(data.falhas || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Load subcategorias when falha changes
  useEffect(() => {
    if (!editData.falha_id) {
      setSubcategorias([]);
      return;
    }

    async function loadSubcategorias() {
      try {
        const res = await fetch(`/api/apontamentos?action=subcategorias&falhaId=${editData.falha_id}`);
        const data = await res.json();
        setSubcategorias(data);
      } catch (err) {
        console.error('Erro ao carregar subcategorias:', err);
      }
    }
    loadSubcategorias();
  }, [editData.falha_id]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to chat
  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setSending(true);
    setLastUserInput(userMessage);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Generate session ID if not exists
    const currentSessionId = sessionId || generateSessionId();
    if (!sessionId) {
      setSessionId(currentSessionId);
    }

    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          sessaoId: currentSessionId,
          mensagem: userMessage,
        }),
      });

      const data = await res.json();

      if (data.tipo === 'confirmacao') {
        // AI collected all fields
        setCampos(data.campos);
        setEditData(data.campos);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.mensagem,
          isConfirmation: true,
          campos: data.campos
        }]);
      } else {
        // AI asking for more info
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.mensagem || data.error || 'Erro ao processar mensagem'
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Erro ao conectar com a IA. Tente novamente.',
        isError: true
      }]);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle edit mode
  const handleToggleEdit = () => {
    setEditMode(!editMode);
  };

  // Update edit field
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
    setMessage(null);
  };

  // Submit to local site
  const handleSubmitLocal = async () => {
    if (!editData.local_id || !editData.equipamento_nome || !editData.falha_id || !editData.subcategoria_id) {
      setMessage({ type: 'error', text: 'Campos obrigatórios faltando' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/apontamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Apontamento registrado com sucesso no site local!' });
        // Show Notion popup
        setCamposForNotion(editData);
        setShowNotionPopup(true);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao registrar: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit to Notion
  const handleSubmitNotion = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const local = locais.find(l => l.id === editData.local_id);
      const falha = falhas.find(f => f.id === editData.falha_id);
      const sub = subcategorias.find(s => s.id === editData.subcategoria_id);

      const title = `Desvio: ${editData.equipamento_nome} - ${local?.nome || ''}`;
      const details = [
        `Canal: ${local?.nome || 'N/A'}`,
        `Equipamento: ${editData.equipamento_nome}`,
        `Falha: ${falha?.descricao || 'N/A'}`,
        `Subcategoria: ${sub?.descricao || 'N/A'}`,
        `Horas Paradas: ${editData.horas_paradas || 'N/A'}`,
        `Recursos Parados: ${editData.recursos_parados || 1}`,
        `Data: ${editData.data_ronda || new Date().toISOString().split('T')[0]}`,
        editData.comentario ? `Comentário: ${editData.comentario}` : '',
      ].filter(Boolean).join('\n');

      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          details,
          status: 'Concluído',
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Apontamento registrado com sucesso no Notion!' });
        handleReset();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao registrar no Notion: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Select/input styles
  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--n-300)',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--n-300)',
    fontSize: 14,
  };

  // Render chat message
  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    
    return (
      <div
        key={index}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            maxWidth: '80%',
            padding: 12,
            borderRadius: 8,
            background: isUser ? 'var(--accent-primary)' : 'var(--n-100)',
            color: isUser ? '#FFFFFF' : 'var(--n-900)',
          }}
        >
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
            {msg.content}
          </div>
          
          {msg.isConfirmation && msg.campos && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: '#FFFFFF',
              borderRadius: 6,
              border: '1px solid var(--n-200)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--n-500)', marginBottom: 8 }}>
                CAMPOS COLETADOS:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><strong>Local:</strong> {msg.campos.local_nome}</div>
                <div><strong>Equipamento:</strong> {msg.campos.equipamento_nome}</div>
                <div><strong>Falha:</strong> {msg.campos.falha_nome}</div>
                <div><strong>Subcategoria:</strong> {msg.campos.subcategoria_nome}</div>
                <div><strong>Horas:</strong> {msg.campos.horas_paradas}h</div>
                <div><strong>Recursos:</strong> {msg.campos.recursos_parados}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Apontamento de Desvios</h1>
            <p className="page-subtitle">Converse com a IA para registrar desvios</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={showDebug ? 'primary' : 'ghost'}
              onClick={() => setShowDebug(!showDebug)}
            >
              <DebugIcon />
              Debug {showDebug ? 'ON' : 'OFF'}
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <ResetIcon />
              Nova Conversa
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: 12,
            background: message.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
            border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
            borderRadius: 6,
            marginBottom: 16,
            color: message.type === 'success' ? '#16A34A' : '#DC2626',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {message.text}
          </div>
        )}

        <div className="grid-2col">
          {/* Chat Area */}
          <Card title="Chat com IA" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              maxHeight: 500,
              padding: '0 4px',
              marginBottom: 16,
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 48,
                  color: 'var(--n-500)',
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                    Como posso ajudar?
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Descreva o desvio que aconteceu. Ex: "Canal 31, mini pc ficou offline por 2 horas, problema de rede"
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => renderMessage(msg, index))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Descreva o desvio..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--n-300)',
                  fontSize: 14,
                }}
                disabled={sending}
              />
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || sending}
              >
                {sending ? <LoadingSpinner /> : <SendIcon />}
              </Button>
            </div>
          </Card>

          {/* Form Area - Shows when campos are collected */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {campos ? (
              <>
                {/* Debug Panel */}
                {showDebug && (
                  <DebugPanel
                    editData={editData}
                    locais={locais}
                    falhas={falhas}
                    subcategorias={subcategorias}
                    userInput={lastUserInput}
                  />
                )}

                <Card title="Dados do Apontamento">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <EditIcon />
                    <span style={{ fontSize: 12, color: 'var(--n-500)' }}>
                      {editMode ? 'Editando campos - modifique conforme necessário' : 'Dados coletados pela IA'}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleToggleEdit}>
                      {editMode ? 'Concluir Edição' : 'Editar'}
                    </Button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Local/Canal */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                        Local/Canal
                      </label>
                      {editMode ? (
                        <select
                          value={editData.local_id || ''}
                          onChange={(e) => handleEditChange('local_id', e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">Selecione</option>
                          {locais.map(l => (
                            <option key={l.id} value={l.id}>{l.nome}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{campos.local_nome}</div>
                      )}
                    </div>

                    {/* Equipamento */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                        Equipamento
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={editData.equipamento_nome || ''}
                          onChange={(e) => handleEditChange('equipamento_nome', e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{campos.equipamento_nome}</div>
                      )}
                    </div>

                    {/* Falha */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                        Falha
                      </label>
                      {editMode ? (
                        <select
                          value={editData.falha_id || ''}
                          onChange={(e) => handleEditChange('falha_id', e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">Selecione</option>
                          {falhas.map(f => (
                            <option key={f.id} value={f.id}>{f.descricao}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{campos.falha_nome}</div>
                      )}
                    </div>

                    {/* Subcategoria */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                        Subcategoria
                      </label>
                      {editMode ? (
                        <select
                          value={editData.subcategoria_id || ''}
                          onChange={(e) => handleEditChange('subcategoria_id', e.target.value)}
                          style={selectStyle}
                          disabled={!editData.falha_id}
                        >
                          <option value="">Selecione</option>
                          {subcategorias.map(s => (
                            <option key={s.id} value={s.id}>{s.descricao}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{campos.subcategoria_nome}</div>
                      )}
                    </div>

                    {/* Horas Paradas */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                        Horas Paradas
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editData.horas_paradas || ''}
                          onChange={(e) => handleEditChange('horas_paradas', e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{campos.horas_paradas}h</div>
                      )}
                    </div>

                    {/* Recursos Parados */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                        Recursos Parados
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          min="1"
                          value={editData.recursos_parados || ''}
                          onChange={(e) => handleEditChange('recursos_parados', e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{campos.recursos_parados}</div>
                      )}
                    </div>

                    {/* Comentário */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                        Comentário
                      </label>
                      {editMode ? (
                        <textarea
                          value={editData.comentario || ''}
                          onChange={(e) => handleEditChange('comentario', e.target.value)}
                          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                        />
                      ) : (
                        <div style={{ fontSize: 14, color: 'var(--n-700)' }}>{campos.comentario}</div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Button
                      variant="primary"
                      onClick={handleSubmitLocal}
                      disabled={submitting || editMode}
                      style={{ width: '100%' }}
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <SaveIcon />
                          Registrar no Site Local
                        </>
                      )}
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={handleSubmitNotion}
                      disabled={submitting || editMode}
                      style={{ width: '100%' }}
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner />
                          Registrando no Notion...
                        </>
                      ) : (
                        <>
                          <NotionIcon />
                          Registrar no Notion
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <Card>
                <div style={{
                  textAlign: 'center',
                  padding: 48,
                  color: 'var(--n-500)',
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                    Aguardando dados do apontamento
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Descreva o desvio no chat e a IA coletará automaticamente todos os campos necessários
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Notion Popup */}
      {showNotionPopup && camposForNotion && (
        <PopupNotion
          campos={camposForNotion}
          onConfirm={() => {
            setShowNotionPopup(false);
            setCamposForNotion(null);
            handleReset();
          }}
          onCancel={() => {
            setShowNotionPopup(false);
            setCamposForNotion(null);
            handleReset();
          }}
        />
      )}
    </>
  );
}
