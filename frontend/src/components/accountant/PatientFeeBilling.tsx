import React, { useState, useEffect, useMemo } from 'react';
import {
  Tile,
  Button,
  Tag,
  InlineNotification,
  Grid,
  Column,
} from '@carbon/react';
import type { FeeRecord } from '../../api/types';
import { patientService } from '../../services/patientService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

interface FeeRecordItem extends Record<string, unknown> {
  id: number;
  booking: FeeRecord['booking'];
  days: number;
  roomCost: number;
  totalCost: number;
}

export const PatientFeeBilling: React.FC = () => {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { notifySuccess, notifyError } = useNotification();

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getFeeRecords();
      setFeeRecords(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleTogglePaid = async (record: FeeRecordItem) => {
    const bookingId = record.booking.id;
    if (!bookingId) return;

    const newStatus = !record.booking.status;
    setUpdatingId(bookingId);
    try {
      await patientService.setBookingPaidStatus(bookingId, newStatus);
      notifySuccess(
        newStatus ? 'Fees Paid & Settled' : 'Marked Unpaid',
        newStatus
          ? `Settled bill for ${record.booking.patient?.firstName} ${record.booking.patient?.familyName}. Inpatient bed released.`
          : `Reopened billing status for ${record.booking.patient?.firstName} ${record.booking.patient?.familyName}.`
      );
      fetchFees();
    } catch (err) {
      notifyError('Failed to update fee status', getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const totalOutstanding = feeRecords
    .filter((r) => !r.booking.status)
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  const totalCollected = feeRecords
    .filter((r) => r.booking.status)
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  const tableData: FeeRecordItem[] = useMemo(() => {
    return feeRecords.map((r, idx) => ({
      id: r.booking.id ?? idx,
      booking: r.booking,
      days: r.days,
      roomCost: r.roomCost,
      totalCost: r.totalCost,
    }));
  }, [feeRecords]);

  const columns: ColumnDef<FeeRecordItem>[] = [
    {
      key: 'patient',
      header: 'Patient Name',
      sortable: true,
      render: (r) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {r.booking.patient?.firstName} {r.booking.patient?.fatherName} {r.booking.patient?.familyName}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            Phone: {r.booking.patient?.phone || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Ward Room & Tier',
      sortable: true,
      render: (r) => (
        <div>
          <span style={{ fontWeight: 500 }}>Room #{r.booking.room?.roomNumber}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {r.booking.room?.roomType?.typeOfroom} &bull; ${r.roomCost}/day
          </div>
        </div>
      ),
    },
    {
      key: 'datePlaced',
      header: 'Admission Date',
      sortable: true,
      render: (r) => formatDisplayDate(r.booking.datePlaced),
    },
    {
      key: 'days',
      header: 'Days Occupied',
      sortable: true,
      render: (r) => (
        <span style={{ fontWeight: 600 }}>
          {r.days} Day{r.days === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      key: 'totalCost',
      header: 'Total Stay Bill',
      sortable: true,
      render: (r) => (
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--cds-text-primary)' }}>
          ${Number(r.totalCost || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Settlement Status',
      render: (r) => (
        <Tag type={r.booking.status ? 'green' : 'red'}>
          {r.booking.status ? 'Paid & Bed Released' : 'Occupied / Unpaid'}
        </Tag>
      ),
    },
    {
      key: 'actions',
      header: 'Toggle Payment',
      render: (r) => {
        const isUpdating = updatingId === r.booking.id;
        return (
          <Button
            size="sm"
            kind={r.booking.status ? 'tertiary' : 'primary'}
            disabled={isUpdating}
            onClick={() => handleTogglePaid(r)}
          >
            {isUpdating ? 'Updating...' : r.booking.status ? 'Reopen Bill' : 'Mark Paid & Discharge'}
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Calculating patient stay charges and room-day fees..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Accountant: Patient Fee Billing</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Inpatient room stay calculations (Daily Room Rate &times; Days Occupied) and discharge payment reconciliation.
          </p>
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

      {/* Summary KPI Tiles */}
      <Grid narrow fullWidth style={{ padding: 0, marginBottom: '1.5rem' }}>
        <Column sm={4} md={4} lg={4}>
          <Tile style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Outstanding Inpatient Balances</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--cds-support-error)', marginTop: '0.25rem' }}>
              ${totalOutstanding.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Active unpaid patient admissions</span>
          </Tile>
        </Column>

        <Column sm={4} md={4} lg={4}>
          <Tile style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Total Reconciled Collections</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--cds-support-success)', marginTop: '0.25rem' }}>
              ${totalCollected.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Settled and discharged patient stays</span>
          </Tile>
        </Column>

        <Column sm={4} md={4} lg={4}>
          <Tile style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Total Stay Records</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--cds-interactive)', marginTop: '0.25rem' }}>
              {feeRecords.length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Historical inpatient admissions</span>
          </Tile>
        </Column>
      </Grid>

      {/* Fees Table */}
      <SearchableTable
        title="Inpatient Billing Ledger"
        description="Daily charge calculations and settlement toggles for patient room occupancy"
        rows={tableData}
        columns={columns}
        searchPlaceholder="Search fee records by patient, room number..."
      />
    </div>
  );
};
