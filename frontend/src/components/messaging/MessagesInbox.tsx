import React, { useState, useEffect } from 'react';
import {
  Button,
  Tag,
  InlineNotification,
  Modal,
} from '@carbon/react';
import { Email, View } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import type { Message } from '../../api/types';
import { messageService } from '../../services/messageService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatDisplayDateTime } from '../../utils/dateUtils';
import { ROUTES } from '../../utils/constants';

export const MessagesInbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const navigate = useNavigate();

  const fetchInbox = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messageService.getInbox();
      setMessages(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleOpenMessage = async (msg: Message) => {
    if (!msg.id) return;
    try {
      const fullMsg = await messageService.getMessageById(msg.id);
      setSelectedMessage(fullMsg);
      // Mark as read locally in list
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, messageStatus: true } : m))
      );
    } catch (err) {
      // Fallback to clicked message object
      setSelectedMessage(msg);
    }
  };

  const columns: ColumnDef<Message>[] = [
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <Tag type={m.messageStatus ? 'cool-gray' : 'red'}>
          {m.messageStatus ? 'Read' : 'Unread'}
        </Tag>
      ),
    },
    {
      key: 'from',
      header: 'Sender (From)',
      sortable: true,
      render: (m) => (
        <div>
          <span style={{ fontWeight: m.messageStatus ? 400 : 700 }}>
            {m.fromEmployee?.firstName} {m.fromEmployee?.familyName}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {m.fromEmployee?.type}
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Preview',
      sortable: true,
      render: (m) => (
        <div>
          <span
            style={{
              fontWeight: m.messageStatus ? 500 : 700,
              color: 'var(--cds-interactive)',
              cursor: 'pointer',
            }}
            onClick={() => handleOpenMessage(m)}
          >
            {m.subject || '(No Subject)'}
          </span>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
              maxWidth: '350px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {m.messageBody}
          </div>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Regarding Patient',
      render: (m) =>
        m.patient ? (
          <span>
            {m.patient.firstName} {m.patient.familyName}
          </span>
        ) : (
          <span style={{ color: 'var(--cds-text-secondary)' }}>General</span>
        ),
    },
    {
      key: 'date',
      header: 'Date & Time',
      sortable: true,
      render: (m) => formatDisplayDateTime(m.messageDate),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <Button
          kind="ghost"
          size="sm"
          renderIcon={View}
          onClick={() => handleOpenMessage(m)}
        >
          Read
        </Button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading internal inbox..." />;
  }

  const unreadCount = messages.filter((m) => !m.messageStatus).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Staff Messages: Inbox</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Internal communications, clinical updates, and patient admissions alerts from hospital staff.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {unreadCount > 0 && (
            <Tag type="red" size="md">
              {unreadCount} Unread Message{unreadCount === 1 ? '' : 's'}
            </Tag>
          )}
          <Button kind="primary" renderIcon={Email} onClick={() => navigate(ROUTES.MESSAGES_COMPOSE)}>
            Compose Message
          </Button>
        </div>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* Inbox Table */}
      <SearchableTable
        title={`Inbox (${messages.length})`}
        description="Incoming messages addressed to your account"
        rows={messages}
        columns={columns}
        searchPlaceholder="Search inbox by sender, subject, message text, patient..."
        emptyMessage="Your inbox is empty. No messages received."
      />

      {/* View Message Modal */}
      {selectedMessage && (
        <Modal
          open={Boolean(selectedMessage)}
          modalHeading={selectedMessage.subject || 'Message Details'}
          primaryButtonText="Close"
          onRequestSubmit={() => setSelectedMessage(null)}
          onRequestClose={() => setSelectedMessage(null)}
          passiveModal
          size="md"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', backgroundColor: 'var(--cds-layer-01)', padding: '1rem', borderRadius: '4px' }}>
              <div>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>FROM</p>
                <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>
                  {selectedMessage.fromEmployee?.firstName} {selectedMessage.fromEmployee?.familyName} ({selectedMessage.fromEmployee?.type})
                </p>
              </div>

              <div>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>DATE & TIME</p>
                <p style={{ margin: '0.25rem 0 0' }}>
                  {formatDisplayDateTime(selectedMessage.messageDate)}
                </p>
              </div>

              {selectedMessage.patient && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>ASSOCIATED PATIENT</p>
                  <p style={{ fontWeight: 500, margin: '0.25rem 0 0' }}>
                    {selectedMessage.patient.firstName} {selectedMessage.patient.fatherName} {selectedMessage.patient.familyName} (Phone: {selectedMessage.patient.phone})
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>MESSAGE BODY</p>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--cds-layer-02)',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontSize: '0.95rem',
                }}
              >
                {selectedMessage.messageBody}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
