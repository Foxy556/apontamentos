'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card, Button, Badge, LoadingSpinner } from '@/components/ui';

// Icons
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
  </svg>
);

const NotionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

// Generate unique session ID
function generateSessionId() {
  return 'notion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export default function NotionAI() {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  // Data
  const [paginas, setPaginas] = useState([]);
  const [loadingPaginas, setLoadingPaginas] = useState(true);
  
  // Messages
  const [message, setMessage] = useState(null);

  // Ref for chat scroll
  const chatEndRef = useRef(null);

  // Load Notion pages
  useEffect(() => {
    async function loadPaginas() {
      try {
        const res = await fetch('/api/notion');
        const data = await res.json();
        setPaginas(data.pages || []);
      } catch (err) {
        console.error('Erro ao carregar páginas:', err);
      } finally {
        setLoadingPaginas(false);
      }
    }
    loadPaginas();
  }, []);

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

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Generate session ID if not exists
    const currentSessionId = sessionId || generateSessionId();
    if (!sessionId) {
      setSessionId(currentSessionId);
    }

    try {
      const res = await fetch('/api/notion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          sessaoId: currentSessionId,
          mensagem: userMessage,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error,
          isError: true
        }]);
      } else if (data.tipo === 'confirmacao') {
        // Resposta de confirmação com múltiplas tarefas
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.mensagem,
          isConfirmacao: true,
          tarefas: data.tarefas
        }]);
      } else if (data.tipo === 'multiplos') {
        // Resposta de múltiplas tarefas executadas
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.mensagem,
          isMultiplos: true,
          resultados: data.resultados
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.mensagem
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

  // Handle confirmation for multiple tasks
  const handleConfirmarTarefas = async () => {
    setInputValue('Sim, pode registrar');
    // Auto-send the confirmation
    setTimeout(() => {
      const btn = document.querySelector('button[data-send="true"]');
      if (btn) btn.click();
    }, 100);
  };

  // Reset chat
  const handleReset = async () => {
    if (sessionId) {
      await fetch('/api/notion-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', sessaoId: sessionId }),
      });
    }
    setMessages([]);
    setSessionId(null);
    setMessage(null);
  };

  // Quick actions
  const quickActions = [
    { label: 'Listar tarefas', message: 'Listar todas as tarefas do Notion' },
    { label: 'Criar tarefa', message: 'Criar uma nova tarefa no Notion' },
    { label: 'Status geral', message: 'Qual é o status geral das tarefas?' },
    { label: 'Registrar no histórico', message: 'Registrar no histórico: ' },
    { label: 'Criar checklist', message: 'Criar checklist no histórico: ' },
  ];

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
            background: isUser ? 'var(--accent-primary)' : msg.isError ? 'var(--error-bg)' : msg.isMultiplos ? 'var(--success-bg)' : msg.isConfirmacao ? 'var(--info-bg)' : 'var(--n-100)',
            color: isUser ? '#FFFFFF' : msg.isError ? 'var(--error)' : msg.isMultiplos ? '#16A34A' : msg.isConfirmacao ? 'var(--info)' : 'var(--n-900)',
            border: msg.isError ? '1px solid var(--error)' : msg.isMultiplos ? '1px solid var(--success)' : msg.isConfirmacao ? '1px solid var(--info)' : 'none',
          }}
        >
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
            {msg.content}
          </div>

          {/* Lista de resultados para múltiplas tarefas executadas */}
          {msg.isMultiplos && msg.resultados && (
            <div style={{
              marginTop: 8,
              padding: 8,
              background: 'rgba(255,255,255,0.8)',
              borderRadius: 6,
              fontSize: 12,
            }}>
              {msg.resultados.map((r, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '2px 0',
                }}>
                  <span>{r.sucesso ? '✅' : '❌'}</span>
                  <span>{r.titulo}</span>
                  {r.erro && <span style={{ color: 'var(--error)', fontSize: 11 }}>({r.erro})</span>}
                </div>
              ))}
            </div>
          )}

          {/* Botão de confirmação para múltiplas tarefas pendentes */}
          {msg.isConfirmacao && msg.tarefas && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={handleConfirmarTarefas}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--success)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                ✅ Confirmar e Registrar
              </button>
              <button
                onClick={() => {
                  setInputValue('Não, cancele');
                  setTimeout(() => {
                    const btn = document.querySelector('button[data-send="true"]');
                    if (btn) btn.click();
                  }, 100);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--n-300)',
                  background: 'transparent',
                  color: 'var(--n-600)',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--n-100)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                ❌ Cancelar
              </button>
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
            <h1 className="page-title">IA Notion</h1>
            <p className="page-subtitle">Assistente inteligente para gerenciar suas tarefas no Notion</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                    Olá! Sou seu assistente Notion
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 16 }}>
                    Posso ajudar você a gerenciar tarefas, criar páginas e muito mais.
                  </div>
                  
                  {/* Quick Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputValue(action.message);
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          border: '1px solid var(--n-200)',
                          background: 'var(--n-50)',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: 'var(--n-700)',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'var(--n-100)';
                          e.target.style.borderColor = 'var(--accent-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'var(--n-50)';
                          e.target.style.borderColor = 'var(--n-200)';
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
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
                placeholder="Digite sua mensagem..."
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
                data-send="true"
              >
                {sending ? <LoadingSpinner /> : <SendIcon />}
              </Button>
            </div>
          </Card>

          {/* Sidebar - Pages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Notion Pages */}
            <Card title="Páginas no Notion">
              {loadingPaginas ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  padding: 24,
                }}>
                  <LoadingSpinner />
                </div>
              ) : paginas.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 24,
                  color: 'var(--n-500)',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 13 }}>
                    Nenhuma página encontrada
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paginas.slice(0, 5).map((pagina) => (
                    <div
                      key={pagina.id}
                      style={{
                        padding: 12,
                        borderRadius: 6,
                        border: '1px solid var(--n-200)',
                        background: 'var(--n-50)',
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 4,
                      }}>
                        <div style={{ 
                          fontSize: 13, 
                          fontWeight: 500,
                          flex: 1,
                        }}>
                          {pagina.title}
                        </div>
                        <Badge variant={
                          pagina.status === 'Concluído' ? 'success' :
                          pagina.status === 'Em Andamento' ? 'info' :
                          pagina.status === 'Pendente' ? 'warning' : 'neutral'
                        } style={{ fontSize: 10 }}>
                          {pagina.status}
                        </Badge>
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        color: 'var(--n-500)',
                      }}>
                        {new Date(pagina.createdTime).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                  {paginas.length > 5 && (
                    <div style={{ 
                      textAlign: 'center', 
                      fontSize: 12, 
                      color: 'var(--n-500)',
                      padding: 8,
                    }}>
                      +{paginas.length - 5} mais páginas
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Quick Tips */}
            <Card title="Dicas Rápidas">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>•</span>
                  <span>"Listar tarefas" - Ver todas as páginas</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>•</span>
                  <span>"Criar tarefa X" - Criar nova página</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>•</span>
                  <span>"Status de X" - Ver status de uma tarefa</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>•</span>
                  <span>"Atualizar X para concluído" - Mudar status</span>
                </div>
                <div style={{ 
                  borderTop: '1px solid var(--n-200)', 
                  paddingTop: 8, 
                  marginTop: 4 
                }}>
                  <div style={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    color: 'var(--n-500)', 
                    marginBottom: 4,
                    textTransform: 'uppercase',
                  }}>
                    Histórico & Compras
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>•</span>
                  <span>"Registrar: comprei material X" - Adicionar no histórico</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>•</span>
                  <span>"Checklist: verificar A, B, C" - Criar checkboxes</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>•</span>
                  <span>"Lista: item1, item2" - Criar lista com marcadores</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
