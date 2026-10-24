import React, { useState, useEffect } from 'react';
import {
  Button,
  Tag,
  InlineNotification,
  IconButton,
} from '@carbon/react';
import { Add, Edit, TrashCan } from '@carbon/icons-react';
import type { Patient } from '../../api/types';
import { patientService } from '../../services/patientService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { ConfirmModal } from '../common/ConfirmModal';
import { PatientFormModal } from './PatientFormModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';

export const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { notifySuccess, notifyError } = useNotification();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getAllPatients();
      setPatients(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingPatient?.id) return;
    setDeleteLoading(true);
    try {
      await patientService.deletePatient(deletingPatient.id);
      notifySuccess('Patient Record Deleted', `Patient ${deletingPatient.firstName} ${deletingPatient.familyName} has been removed.`);
      setDeletingPatient(null);
      fetchPatients();
    } catch (err) {
      notifyError('Failed to delete patient', getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: ColumnDef<Patient>[] = [
    {
      key: 'name',
      header: 'Patient Name',
      sortable: true,
      render: (p) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {p.firstName} {p.fatherName} {p.familyName}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            DOB: {p.dob} &bull; {p.gender}
          </div>
        </div>
      ),
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      sortable: true,
      render: (p) => (
        <Tag type="red" size="md">
          {p.bloodGroup?.bloodGroup || 'Unknown'}
        </Tag>
      ),
    },
    {
      key: 'contact',
      header: 'Contact & Address',
      render: (p) => (
        <div>
          <div>{p.phone}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {p.address} {p.email ? `• ${p.email}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'nextOfKin',
      header: 'Emergency Contact (Next of Kin)',
      render: (p) => {
        if (!p.nextOfKin) return <span style={{ color: 'var(--cds-text-secondary)' }}>None</span>;
        return (
          <div>
            <span style={{ fontWeight: 500 }}>{p.nextOfKin.fullName}</span>
            <Tag size="sm" type="warm-gray" style={{ marginLeft: '0.5rem' }}>
              {p.nextOfKin.relationship}
            </Tag>
            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              Phone: {p.nextOfKin.phone}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <IconButton
            label="Edit Patient"
            kind="ghost"
            size="sm"
            onClick={() => handleOpenEdit(p)}
          >
            <Edit />
          </IconButton>
          <IconButton
            label="Delete Patient"
            kind="ghost"
            size="sm"
            onClick={() => setDeletingPatient(p)}
          >
            <TrashCan />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading patient directory..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Inpatient & Outpatient Registry</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Manage patient demographic records, blood group typing, and emergency next-of-kin contacts.
          </p>
        </div>
        <Button kind="primary" renderIcon={Add} onClick={handleOpenAdd}>
          Register New Patient
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

      {/* Patient Table */}
      <SearchableTable
        title={`Registered Patients (${patients.length})`}
        description="Comprehensive directory of active and admitted hospital patients"
        rows={patients}
        columns={columns}
        searchPlaceholder="Search patients by name, phone, address, blood group..."
      />

      {/* Patient Form Modal */}
      <PatientFormModal
        open={formModalOpen}
        patientToEdit={editingPatient}
        onClose={() => setFormModalOpen(false)}
        onSuccess={(saved) => {
          setFormModalOpen(false);
          notifySuccess(
            editingPatient ? 'Patient Updated' : 'Patient Registered',
            `Record for ${saved.firstName} ${saved.familyName} was saved successfully.`
          );
          fetchPatients();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingPatient)}
        title="Confirm Patient Record Deletion"
        modalHeading="Delete Patient Record"
        danger
        primaryButtonText="Delete Record"
        loading={deleteLoading}
        onRequestClose={() => setDeletingPatient(null)}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to permanently delete patient{' '}
          <strong>
            {deletingPatient?.firstName} {deletingPatient?.familyName}
          </strong>?
        </p>
        <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Deleting this patient will also delete all associated internal messages, bed reservations, and clinical records.
        </p>
      </ConfirmModal>
    </div>
  );
};
