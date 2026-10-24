import React, { useState, useEffect } from 'react';
import {
  Grid,
  Column,
  Tile,
  Form,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Button,
  InlineNotification,
  IconButton,
  Tag,
} from '@carbon/react';
import { Add, Edit, TrashCan } from '@carbon/icons-react';
import type { Disease, Patient, DiseaseRequest } from '../../api/types';
import { clinicalService } from '../../services/clinicalService';
import { patientService } from '../../services/patientService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const DoctorDiagnoses: React.FC = () => {
  const { role } = useAuth();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states (Add / Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | ''>('');
  const [diseaseName, setDiseaseName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [deletingItem, setDeletingItem] = useState<Disease | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { notifySuccess, notifyError } = useNotification();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const isDoctor = role?.toLowerCase() === 'doctor';
      const [diseasesData, patientsData] = await Promise.all([
        isDoctor ? clinicalService.getMyDiseases() : clinicalService.getDiseases(),
        patientService.getAllPatients(),
      ]);
      setDiseases(diseasesData || []);
      setPatients(patientsData || []);

      if (patientsData && patientsData.length > 0 && patientId === '') {
        setPatientId(patientsData[0].id || 1);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    if (patients.length > 0) setPatientId(patients[0].id || 1);
    setDiseaseName('');
    setNote('');
    setFormError(null);
  };

  const handleStartEdit = (item: Disease) => {
    setIsEditing(true);
    setEditingId(item.id || null);
    setPatientId(item.patient?.id || (patients[0]?.id ?? 1));
    setDiseaseName(item.disease || '');
    setNote(item.note || '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientId) {
      setFormError('Please select a patient.');
      return;
    }
    if (!diseaseName.trim()) {
      setFormError('Disease or diagnosis name is required.');
      return;
    }

    const payload: DiseaseRequest = {
      patientId: Number(patientId),
      disease: diseaseName.trim(),
      note: note.trim() || undefined,
    };

    setFormLoading(true);
    try {
      if (isEditing && editingId) {
        await clinicalService.updateDisease(editingId, payload);
        notifySuccess('Diagnosis Updated', 'The clinical diagnosis and physician notes have been updated.');
      } else {
        await clinicalService.recordDisease(payload);
        notifySuccess('Diagnosis Recorded', 'New disease diagnosis and treatment notes recorded successfully.');
      }
      resetForm();
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id) return;
    setDeleteLoading(true);
    try {
      await clinicalService.deleteDisease(deletingItem.id);
      notifySuccess('Diagnosis Removed', 'The clinical diagnosis entry has been deleted.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      notifyError('Failed to delete diagnosis', getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: ColumnDef<Disease>[] = [
    {
      key: 'patient',
      header: 'Patient Name',
      sortable: true,
      render: (d) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {d.patient?.firstName} {d.patient?.fatherName} {d.patient?.familyName}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            Phone: {d.patient?.phone || '—'} &bull; Blood: {d.patient?.bloodGroup?.bloodGroup || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'disease',
      header: 'Diagnosed Condition',
      sortable: true,
      render: (d) => (
        <span style={{ fontWeight: 600, color: 'var(--cds-text-primary)' }}>
          {d.disease}
        </span>
      ),
    },
    {
      key: 'note',
      header: 'Physician Clinical Notes',
      render: (d) => (
        <div style={{ maxWidth: '300px', fontSize: '0.875rem' }}>
          {d.note || <span style={{ color: 'var(--cds-text-secondary)' }}>No notes recorded</span>}
        </div>
      ),
    },
    {
      key: 'diseaseDate',
      header: 'Date Diagnosed',
      sortable: true,
      render: (d) => formatDisplayDate(d.diseaseDate),
    },
    {
      key: 'doctor',
      header: 'Attending Doctor',
      render: (d) => (
        <Tag type="magenta">
          Dr. {d.employee?.firstName || 'Assigned'} {d.employee?.familyName || ''}
        </Tag>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <IconButton
            label="Edit Diagnosis"
            kind="ghost"
            size="sm"
            onClick={() => handleStartEdit(d)}
          >
            <Edit />
          </IconButton>
          <IconButton
            label="Delete Diagnosis"
            kind="ghost"
            size="sm"
            onClick={() => setDeletingItem(d)}
          >
            <TrashCan />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading clinical diagnosis notes..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Doctor Clinical Diagnoses & Notes</h1>
        <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
          Record diagnostic assessments, pathological findings, and treatment instructions for patients.
        </p>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      <Grid narrow fullWidth style={{ padding: 0 }}>
        {/* Form Panel (Record / Edit Diagnosis) */}
        <Column sm={4} md={8} lg={4} style={{ marginBottom: '1.5rem' }}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {isEditing ? 'Update Diagnosis Entry' : 'Record Clinical Diagnosis'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
              {isEditing
                ? 'Update disease evaluation or physician notes'
                : 'Document patient condition assessment'}
            </p>

            {formError && (
              <InlineNotification
                kind="error"
                title="Validation Error"
                subtitle={formError}
                style={{ marginBottom: '1rem' }}
              />
            )}

            <Form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Select
                  id="diagPatientId"
                  labelText="Select Patient *"
                  value={patientId}
                  onChange={(e) => setPatientId(Number(e.target.value))}
                >
                  {patients.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      text={`${p.firstName} ${p.fatherName} ${p.familyName} (${p.bloodGroup?.bloodGroup || 'Blood: Unknown'})`}
                    />
                  ))}
                </Select>

                <TextInput
                  id="diseaseName"
                  labelText="Diagnosis / Condition Name *"
                  placeholder="e.g. Acute Bronchitis, Type 2 Diabetes"
                  value={diseaseName}
                  onChange={(e) => setDiseaseName(e.target.value)}
                  required
                />

                <TextArea
                  id="diseaseNote"
                  labelText="Physician Clinical Notes & Instructions"
                  placeholder="Enter clinical observations, prescribed lab tests, or follow-up instructions..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                />

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button
                    type="submit"
                    kind="primary"
                    disabled={formLoading}
                    renderIcon={isEditing ? Edit : Add}
                    style={{ flex: 1 }}
                  >
                    {formLoading ? 'Saving...' : isEditing ? 'Update Diagnosis' : 'Save Diagnosis'}
                  </Button>
                  {isEditing && (
                    <Button
                      type="button"
                      kind="secondary"
                      onClick={resetForm}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          </Tile>
        </Column>

        {/* Diagnoses Table */}
        <Column sm={4} md={8} lg={8} style={{ marginBottom: '1.5rem' }}>
          <SearchableTable
            title={`Clinical Diagnoses Records (${diseases.length})`}
            description="Diagnostic evaluations and physician treatment notes across all patients"
            rows={diseases}
            columns={columns}
            searchPlaceholder="Search diagnoses by patient, condition, notes..."
          />
        </Column>
      </Grid>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingItem)}
        title="Confirm Diagnosis Deletion"
        modalHeading="Delete Clinical Diagnosis"
        danger
        primaryButtonText="Delete Record"
        loading={deleteLoading}
        onRequestClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to remove the diagnosis record &quot;
          <strong>{deletingItem?.disease}</strong>&quot; for patient{' '}
          <strong>
            {deletingItem?.patient?.firstName} {deletingItem?.patient?.familyName}
          </strong>?
        </p>
      </ConfirmModal>
    </div>
  );
};
