import React, { useState, useEffect } from 'react';
import {
  Tag,
  InlineNotification,
  Modal,
} from '@carbon/react';
import type { Patient, Disease } from '../../api/types';
import { patientService } from '../../services/patientService';
import { clinicalService } from '../../services/clinicalService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const ClinicalPatientDirectory: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Patient Details Modal
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [patientsData, diseasesData] = await Promise.all([
        patientService.getAllPatients(),
        clinicalService.getDiseases(),
      ]);
      setPatients(patientsData || []);
      setDiseases(diseasesData || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPatientDiseases = (patientId?: number) => {
    if (!patientId) return [];
    return diseases.filter((d) => d.patient?.id === patientId);
  };

  const columns: ColumnDef<Patient>[] = [
    {
      key: 'name',
      header: 'Patient Name',
      sortable: true,
      render: (p) => (
        <div>
          <span
            style={{ fontWeight: 600, color: 'var(--cds-interactive)', cursor: 'pointer' }}
            onClick={() => setSelectedPatient(p)}
          >
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
        <Tag type="red">
          {p.bloodGroup?.bloodGroup || 'Unknown'}
        </Tag>
      ),
    },
    {
      key: 'diagnoses',
      header: 'Active Diagnoses & Conditions',
      render: (p) => {
        const patDiseases = getPatientDiseases(p.id);
        if (patDiseases.length === 0) {
          return <span style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>No recorded diagnoses</span>;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {patDiseases.map((d, i) => (
              <Tag key={d.id || i} type="magenta" size="sm">
                {d.disease}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Contact Phone',
      render: (p) => p.phone,
    },
    {
      key: 'address',
      header: 'Address',
      render: (p) => p.address,
    },
    {
      key: 'nextOfKin',
      header: 'Next of Kin (Emergency)',
      render: (p) => {
        if (!p.nextOfKin) return <span style={{ color: 'var(--cds-text-secondary)' }}>None</span>;
        return (
          <div>
            <span>{p.nextOfKin.fullName} ({p.nextOfKin.relationship})</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              Phone: {p.nextOfKin.phone}
            </div>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading clinical patient directory..." />;
  }

  const patientModalDiseases = selectedPatient ? getPatientDiseases(selectedPatient.id) : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Clinical Patient Directory</h1>
        <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
          Read-only clinical patient charts, blood group typing, diagnostic histories, and emergency contacts for Nurse, Lab, and X-Ray staff.
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

      {/* Patient Directory Table */}
      <SearchableTable
        title={`Inpatient / Outpatient Records (${patients.length})`}
        description="Comprehensive clinical overview of registered patients"
        rows={patients}
        columns={columns}
        searchPlaceholder="Search patients by name, blood group, diagnosis..."
      />

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <Modal
          open={Boolean(selectedPatient)}
          modalHeading={`Patient Chart: ${selectedPatient.firstName} ${selectedPatient.familyName}`}
          primaryButtonText="Close"
          onRequestSubmit={() => setSelectedPatient(null)}
          onRequestClose={() => setSelectedPatient(null)}
          passiveModal
          size="md"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>FULL NAME</p>
                <p style={{ fontWeight: 600, margin: '0.25rem 0 0' }}>
                  {selectedPatient.firstName} {selectedPatient.fatherName} {selectedPatient.familyName}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>BLOOD GROUP</p>
                <p style={{ margin: '0.25rem 0 0' }}>
                  <Tag type="red">{selectedPatient.bloodGroup?.bloodGroup || 'Unknown'}</Tag>
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>DATE OF BIRTH & GENDER</p>
                <p style={{ margin: '0.25rem 0 0' }}>{selectedPatient.dob} ({selectedPatient.gender})</p>
              </div>
              <div>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>CONTACT PHONE</p>
                <p style={{ margin: '0.25rem 0 0' }}>{selectedPatient.phone}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', margin: 0 }}>ADDRESS</p>
                <p style={{ margin: '0.25rem 0 0' }}>{selectedPatient.address}</p>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', borderTop: '1px solid var(--cds-border-subtle)', paddingTop: '1rem' }}>
              Diagnostic & Clinical History ({patientModalDiseases.length})
            </h4>

            {patientModalDiseases.length === 0 ? (
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                No clinical diagnosis records found for this patient.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {patientModalDiseases.map((d, idx) => (
                  <div key={d.id || idx} style={{ padding: '0.75rem', backgroundColor: 'var(--cds-layer-01)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--cds-text-primary)' }}>{d.disease}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                        {formatDisplayDate(d.diseaseDate)}
                      </span>
                    </div>
                    {d.note && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                        {d.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
