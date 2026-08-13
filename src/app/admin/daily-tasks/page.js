'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card, Button, Badge, LoadingSpinner } from '@/components/ui';

// Icons
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function DailyTasks() {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [novaTarefa, setNovaTarefa] = useState('');
  const [filtro, setFiltro] = useState('todas');

  // Carregar tarefas
  const carregarTarefas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/daily-tasks');
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setTarefas(data.tarefas || []);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao carregar tarefas: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTarefas();
  }, []);

  // Adicionar tarefa
  const handleAdicionar = async (e) => {
    e.preventDefault();
    if (!novaTarefa.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: novaTarefa.trim() }),
      });

      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Tarefa adicionada com sucesso!' });
        setNovaTarefa('');
        carregarTarefas();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao adicionar tarefa: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Atualizar status da tarefa
  const handleAtualizarStatus = async (pageId, ativo) => {
    try {
      const res = await fetch('/api/daily-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, ativo }),
      });

      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        carregarTarefas();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao atualizar tarefa: ' + err.message });
    }
  };

  // Deletar tarefa
  const handleDeletar = async (pageId) => {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;

    try {
      const res = await fetch(`/api/daily-tasks?pageId=${pageId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Tarefa deletada com sucesso!' });
        carregarTarefas();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao deletar tarefa: ' + err.message });
    }
  };

  // Filtrar tarefas
  const tarefasFiltradas = tarefas.filter(t => {
    if (filtro === 'todas') return true;
    if (filtro === 'pendentes') return !t.ativo;
    if (filtro === 'concluidas') return t.ativo;
    if (filtro === 'faborita') return t.categoria === 'Fábrica';
    return true;
  });

  // Estatísticas
  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter(t => t.ativo).length;
  const tarefasPendentes = totalTarefas - tarefasConcluidas;
  const percentualConcluido = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Tarefas Diárias</h1>
            <p className="page-subtitle">Gerencie suas tarefas do dia no Notion</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={carregarTarefas}>
              <RefreshIcon />
              Atualizar
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
            <button 
              onClick={() => setMessage(null)}
              style={{ 
                marginLeft: 'auto', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid-stats" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-card-label">Total</div>
            <div className="stat-card-value">{totalTarefas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Pendentes</div>
            <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
              {tarefasPendentes}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Concluídas</div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>
              {tarefasConcluidas}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Progresso</div>
            <div className="stat-card-value" style={{ color: 'var(--accent-primary)' }}>
              {percentualConcluido}%
            </div>
          </div>
        </div>

        {/* Formulário de nova tarefa */}
        <Card title="Nova Tarefa" style={{ marginBottom: 16 }}>
          <form onSubmit={handleAdicionar} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={novaTarefa}
              onChange={(e) => setNovaTarefa(e.target.value)}
              placeholder="Digite uma nova tarefa..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--n-300)',
                fontSize: 14,
              }}
              disabled={submitting}
            />
            <Button 
              type="submit" 
              variant="primary" 
              disabled={submitting || !novaTarefa.trim()}
            >
              {submitting ? (
                <LoadingSpinner />
              ) : (
                <>
                  <PlusIcon />
                  Adicionar
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Filtros */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'pendentes', label: 'Pendentes' },
            { key: 'concluidas', label: 'Concluídas' },
            { key: 'faborita', label: 'Fábrica' },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filtro === f.key ? 'primary' : 'secondary'}
              onClick={() => setFiltro(f.key)}
              style={{ fontSize: 13 }}
            >
              {f.label}
              {f.key !== 'todas' && (
                <span style={{
                  marginLeft: 4,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: filtro === f.key ? 'rgba(255,255,255,0.2)' : 'var(--n-100)',
                  fontSize: 11,
                }}>
                  {f.key === 'pendentes' ? tarefasPendentes : 
                   f.key === 'concluidas' ? tarefasConcluidas :
                   tarefas.filter(t => t.categoria === 'Fábrica').length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Lista de tarefas */}
        <Card>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: 48,
            }}>
              <LoadingSpinner />
              <span style={{ marginLeft: 12, color: 'var(--n-500)' }}>
                Carregando tarefas...
              </span>
            </div>
          ) : tarefasFiltradas.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
              <div className="empty-state-title">
                {filtro === 'todas' ? 'Nenhuma tarefa encontrada' : 
                 filtro === 'pendentes' ? 'Nenhuma tarefa pendente' :
                 'Nenhuma tarefa concluída'}
              </div>
              <div className="empty-state-text">
                {filtro === 'todas' 
                  ? 'Adicione uma nova tarefa usando o formulário acima.'
                  : 'Tente selecionar outro filtro ou adicione uma nova tarefa.'
                }
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tarefasFiltradas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid var(--n-200)',
                    background: tarefa.ativo ? 'var(--n-50)' : '#FFFFFF',
                    opacity: tarefa.ativo ? 0.7 : 1,
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleAtualizarStatus(tarefa.id, !tarefa.ativo)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: `2px solid ${tarefa.ativo ? 'var(--success)' : 'var(--n-300)'}`,
                      background: tarefa.ativo ? 'var(--success)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0,
                    }}
                  >
                    {tarefa.ativo && <CheckIcon />}
                  </button>

                  {/* Texto */}
                  <div style={{
                    flex: 1,
                    fontSize: 14,
                    textDecoration: tarefa.ativo ? 'line-through' : 'none',
                    color: tarefa.ativo ? 'var(--n-500)' : 'var(--n-900)',
                  }}>
                    {tarefa.titulo}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tarefa.categoria && (
                      <Badge variant="neutral" style={{ fontSize: 10 }}>
                        {tarefa.categoria}
                      </Badge>
                    )}
                    {tarefa.frequencia && (
                      <Badge variant="info" style={{ fontSize: 10 }}>
                        {tarefa.frequencia}
                      </Badge>
                    )}
                    {tarefa.status && (
                      <Badge variant={
                        tarefa.status === 'Concluído' ? 'success' :
                        tarefa.status === 'Em Andamento' ? 'info' :
                        tarefa.status === 'Pendente' ? 'warning' : 'neutral'
                      } style={{ fontSize: 10 }}>
                        {tarefa.status}
                      </Badge>
                    )}
                  </div>

                  {/* Botão deletar */}
                  <button
                    onClick={() => handleDeletar(tarefa.id)}
                    style={{
                      padding: 4,
                      borderRadius: 4,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--n-400)',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--error)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--n-400)'}
                    title="Deletar tarefa"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Link para Notion */}
        <div style={{ 
          marginTop: 16, 
          textAlign: 'center',
          padding: 12,
          background: 'var(--n-50)',
          borderRadius: 6,
          border: '1px solid var(--n-200)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--n-600)' }}>
            Ver no Notion:{' '}
          </span>
          <a
            href="https://app.notion.com/p/9c58157778f74750a8abb26ebc6d432c?v=26c49a00f80d4d5d821ea424bf5b257b"
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: 'var(--accent-primary)', 
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Abrir no Notion ↗
          </a>
        </div>
      </main>
    </>
  );
}
