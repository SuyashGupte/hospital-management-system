import React, { useState, useEffect } from 'react';
import {
  Tile,
  Form,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  RadioButtonGroup,
  RadioButton,
  Button,
  InlineNotification,
  Stack,
} from '@carbon/react';
import { Send, ArrowLeft } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import type { Employee, Patient, MessageRequest } from '../../api/types';
import { messageService } from '../../services/messageService';
import { employeeService } from '../../services/employeeService';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';

export const MessagesCompose: React.FC = () => {
  const [recipientType, setRecipientType] = useState<'individual' | 'all_receptionists'>('individual');
  const [recipientId, setRecipientId] = useState<number | ''>('');
  const [patientId, setPatientId] = useState<number | ''>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifySuccess } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empData, patData] = await Promise.all([
          employeeService.getRecipients(),
          patientService.getAllPatients(),
        ]);

        const filteredEmployees = (empData || []).filter((e) => e.id !== user?.id);
        setEmployees(filteredEmployees);
        setPatients(patData || []);

        if (filteredEmployees.length > 0) {
          setRecipientId(filteredEmployees[0].id || 1);
        }
        if (patData && patData.length > 0) {
          setPatientId(patData[0].id || 1);
        }
      } catch (err) {
        setFormError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const isAllReceptionists = recipientType === 'all_receptionists';

    if (!isAllReceptionists && !recipientId) {
      setFormError('Please select a recipient employee.');
      return;
    }
    if (!patientId) {
      setFormError('Please select the associated patient.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Message subject is required.');
      return;
    }
    if (!body.trim()) {
      setFormError('Message body content is required.');
      return;
    }

    const payload: MessageRequest = {
      recipientId: isAllReceptionists ? undefined : Number(recipientId),
      allReceptionists: isAllReceptionists,
      patientId: Number(patientId),
      subject: subject.trim(),
      body: body.trim(),
    };

    setSending(true);
    try {
      await messageService.composeMessage(payload);
      notifySuccess(
        'Message Dispatched',
        isAllReceptionists
          ? 'Broadcast notification successfully dispatched to all reception staff.'
          : 'Direct staff communication delivered successfully.'
      );
      navigate(ROUTES.MESSAGES_SENT);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner description="Loading staff directory and patient list..." />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button
          kind="ghost"
          size="sm"
          renderIcon={ArrowLeft}
          hasIconOnly
          iconDescription="Back to Inbox"
          onClick={() => navigate(ROUTES.MESSAGES_INBOX)}
        />
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Compose Internal Message</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Send secure clinical communications, handover notes, or patient admission advisories.
          </p>
        </div>
      </div>

      <Tile style={{ padding: '2rem' }}>
        {formError && (
          <InlineNotification
            kind="error"
            title="Validation Error"
            subtitle={formError}
            style={{ marginBottom: '1.5rem' }}
          />
        )}

        <Form onSubmit={handleSubmit}>
          <Stack gap={6}>
            <RadioButtonGroup
              legendText="Delivery Mode"
              name="recipientType"
              valueSelected={recipientType}
              onChange={(val) => setRecipientType(val as 'individual' | 'all_receptionists')}
            >
              <RadioButton
                labelText="Individual Staff Member"
                value="individual"
                id="rec-individual"
              />
              <RadioButton
                labelText="Broadcast to All Receptionists"
                value="all_receptionists"
                id="rec-broadcast"
              />
            </RadioButtonGroup>

            {recipientType === 'individual' && (
              <Select
                id="recipientId"
                labelText="To (Recipient Employee) *"
                value={recipientId}
                onChange={(e) => setRecipientId(Number(e.target.value))}
              >
                {employees.map((emp) => (
                  <SelectItem
                    key={emp.id}
                    value={emp.id}
                    text={`${emp.type}: ${emp.firstName} ${emp.fatherName} ${emp.familyName} (@${emp.userName})`}
                  />
                ))}
              </Select>
            )}

            <Select
              id="patientId"
              labelText="Regarding Patient *"
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
            >
              {patients.map((pat) => (
                <SelectItem
                  key={pat.id}
                  value={pat.id}
                  text={`${pat.firstName} ${pat.fatherName} ${pat.familyName} (Phone: ${pat.phone}, Blood: ${pat.bloodGroup?.bloodGroup || '—'})`}
                />
              ))}
            </Select>

            <TextInput
              id="messageSubject"
              labelText="Message Subject *"
              placeholder="e.g. Urgent: Medication Handover for Patient Smith"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <TextArea
              id="messageBody"
              labelText="Message Body *"
              placeholder="Type your handover notes, patient condition observations, or instructions..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button
                type="button"
                kind="secondary"
                disabled={sending}
                onClick={() => navigate(ROUTES.MESSAGES_INBOX)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                kind="primary"
                renderIcon={Send}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </Stack>
        </Form>
      </Tile>
    </div>
  );
};
