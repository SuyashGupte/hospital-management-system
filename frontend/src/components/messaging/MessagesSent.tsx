import React, { useState, useEffect } from 'react';
import {
  Button,
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

export const MessagesSent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const navigate = useNavigate();

  const fetchSent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messageService.getSentMessages();
      setMessages(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSent();
  }, []);

  const columns: ColumnDef<Message>[] = [
    {
      key: 'to',
      header: 'Recipient (To)',
      sortable: true,
      render: (m) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {m.toEmployee
              ? `${m.toEmployee.firstName} ${m.toEmployee.familyName}`
              : 'Reception Staff'}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {m.toEmployee?.type || 'Reception Broadcast'}
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
              fontWeight: 600,
              color: 'var(--cds-interactive)',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedMessage(m)}
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
      header: 'Date & Time Sent',
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
          onClick={() => setSelectedMessage(m)}
        >
          View
        </Button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading sent communications..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Staff Messages: Sent Mail</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Historical record of all internal communications dispatched by your account.
          </p>
        </div>
        <Button kind="primary" renderIcon={Email} onClick={() => navigate(ROUTES.MESSAGES_COMPOSE)}>
          Compose New Message
        </Button>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* Sent Table */}
      <SearchableTable
        title={`Sent Messages (${messages.length})`}
        description="Outbox message logs and recipient delivery records"
        rows={messages}
        columns={columns}
        searchPlaceholder="Search sent mail by recipient, subject, patient..."
        emptyMessage="You have not sent any messages yet."
      />

      {/* View Sent Message Modal */}
      {selectedMessage && (
        <Modal
          open={Boolean(selectedMessage)}
          modalHeading={selectedMessage.subject || 'Sent Message Details'}
          primaryButtonText="Close"
          onRequestSubmit={() => setSelectedMessage(null)}
          onRequestClose={() => setSelectedMessage(null)}
          passiveModal
          size="md"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', backgroundColor: 'var(--cds-layer-01)', padding: '1rem', borderRadius: '4px' }}>
              <div>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>RECIPIENT (TO)</p>
                <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>
                  {selectedMessage.toEmployee
                    ? `${selectedMessage.toEmployee.firstName} ${selectedMessage.toEmployee.familyName} (${selectedMessage.toEmployee.type})`
                    : 'All Receptionists (Broadcast)'}
                </p>
              </div>

              <div>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>DATE & TIME SENT</p>
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
