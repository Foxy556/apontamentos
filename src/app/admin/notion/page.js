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

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export default function ApontamentosNotion() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState('Todos');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    details: '',
    status: 'Pendente',
  });

  // Load pages from Notion
  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notion');
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setPages(data.pages || []);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao carregar apontamentos: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  // Filter pages
  const filteredPages = filter === 'Todos' 
    ? pages 
    : pages.filter(p => p.status === filter);

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Título é obrigatório' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Apontamento criado com sucesso no Notion!' });
        setFormData({ title: '', details: '', status: 'Pendente' });
        setShowForm(false);
        loadPages();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao criar apontamento: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Update page status
  const handleUpdateStatus = async (pageId, newStatus) => {
    try {
      const res = await fetch('/api/notion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, status: newStatus }),
      });

      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        loadPages();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao atualizar status: ' + err.message });
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      'Concluído': 'success',
      'Em Andamento': 'info',
      'Pendente': 'warning',
      'Cancelado': 'error',
    };
    return statusMap[status] || 'neutral';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Apontamentos Notion</h1>
            <p className="page-subtitle">Gerencie seus apontamentos no Notion</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={loadPages}>
              <RefreshIcon />
              Atualizar
            </Button>
            <Button variant="primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? <CloseIcon /> : <PlusIcon />}
              {showForm ? 'Cancelar' : 'Novo Apontamento'}
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

        {/* New Apontamento Form */}
        {showForm && (
          <Card title="Novo Apontamento" style={{ marginBottom: 16 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Manutenção preventiva PLC"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--n-300)',
                      fontSize: 14,
                    }}
                    required
                  />
                </div>

                {/* Details */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                    Detalhes
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => handleInputChange('details', e.target.value)}
                    placeholder="Descreva o apontamento detalhadamente..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--n-300)',
                      fontSize: 14,
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-500)', marginBottom: 4 }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--n-300)',
                      fontSize: 14,
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner />
                        Criando...
                      </>
                    ) : (
                      <>
                        <SaveIcon />
                        Criar Apontamento
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        )}

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          {['Todos', 'Pendente', 'Em Andamento', 'Concluído', 'Cancelado'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'secondary'}
              onClick={() => setFilter(status)}
              style={{ fontSize: 13 }}
            >
              {status}
              {status !== 'Todos' && (
                <span style={{ 
                  marginLeft: 4,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: filter === status ? 'rgba(255,255,255,0.2)' : 'var(--n-100)',
                  fontSize: 11,
                }}>
                  {pages.filter(p => p.status === status).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Pages List */}
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
                Carregando apontamentos...
              </span>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div className="empty-state-title">
                {filter === 'Todos' ? 'Nenhum apontamento encontrado' : `Nenhum apontamento com status "${filter}"`}
              </div>
              <div className="empty-state-text">
                {filter === 'Todos' 
                  ? 'Crie um novo apontamento clicando no botão acima.'
                  : 'Tente selecionar outro filtro ou crie um novo apontamento.'
                }
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Detalhes</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPages.map((page) => (
                    <tr key={page.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{page.title}</div>
                      </td>
                      <td>
                        <div style={{ 
                          maxWidth: 300, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--n-600)',
                          fontSize: 13,
                        }}>
                          {page.details || '-'}
                        </div>
                      </td>
                      <td>
                        <Badge variant={getStatusBadge(page.status)}>
                          {page.status}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--n-500)' }}>
                        {formatDate(page.createdTime)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {page.status !== 'Concluído' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(page.id, 'Concluído')}
                              title="Marcar como concluído"
                            >
                              <CheckIcon />
                            </Button>
                          )}
                          {page.status === 'Pendente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(page.id, 'Em Andamento')}
                              title="Iniciar"
                            >
                              ▶
                            </Button>
                          )}
                          {page.status !== 'Cancelado' && page.status !== 'Concluído' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(page.id, 'Cancelado')}
                              title="Cancelar"
                              style={{ color: 'var(--error)' }}
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Stats */}
        {!loading && pages.length > 0 && (
          <div className="grid-stats" style={{ marginTop: 16 }}>
            <div className="stat-card">
              <div className="stat-card-label">Total</div>
              <div className="stat-card-value">{pages.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Pendentes</div>
              <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
                {pages.filter(p => p.status === 'Pendente').length}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Em Andamento</div>
              <div className="stat-card-value" style={{ color: 'var(--info)' }}>
                {pages.filter(p => p.status === 'Em Andamento').length}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Concluídos</div>
              <div className="stat-card-value" style={{ color: 'var(--success)' }}>
                {pages.filter(p => p.status === 'Concluído').length}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
