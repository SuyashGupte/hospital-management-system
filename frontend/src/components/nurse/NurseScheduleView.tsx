import React, { useState, useEffect } from 'react';
import {
  Tag,
  InlineNotification,
} from '@carbon/react';
import { Calendar, Enterprise } from '@carbon/icons-react';
import type { NurseServiceTime } from '../../api/types';
import { facilityService } from '../../services/facilityService';
import { useAuth } from '../../hooks/useAuth';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const NurseScheduleView: React.FC = () => {
  const [schedule, setSchedule] = useState<NurseServiceTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await facilityService.getMyServiceTimes();
        setSchedule(data || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user]);

  const columns: ColumnDef<NurseServiceTime>[] = [
    {
      key: 'serviceDate',
      header: 'Duty Date',
      sortable: true,
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} style={{ color: 'var(--cds-interactive)' }} />
          <span style={{ fontWeight: 600 }}>{formatDisplayDate(s.serviceDate)}</span>
        </div>
      ),
    },
    {
      key: 'shiftTime',
      header: 'Shift Hours Window',
      render: (s) => (
        <Tag type="cyan">
          {s.shiftTime?.fromTime || '—'} - {s.shiftTime?.toTime || '—'}
        </Tag>
      ),
    },
    {
      key: 'department',
      header: 'Assigned Department / Ward',
      sortable: true,
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Enterprise size={16} />
          <span>{s.department}</span>
        </div>
      ),
    },
    {
      key: 'nurse',
      header: 'Assigned Nurse',
      render: (s) => `${s.nurse?.firstName || ''} ${s.nurse?.familyName || ''}`,
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading your shift duty schedule..." />;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>My Shift Duty Schedule</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Roster of scheduled hospital ward shifts and assigned duty time windows.
          </p>
        </div>
        <Tag type="teal" size="md">
          {schedule.length} Assigned Shift{schedule.length === 1 ? '' : 's'}
        </Tag>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* Schedule Table */}
      <SearchableTable
        title="Duty Rotations Roster"
        description="Upcoming and assigned clinical shift schedules"
        rows={schedule}
        columns={columns}
        searchPlaceholder="Filter duty shifts by date or department..."
        emptyMessage="No assigned shift duty times found on your roster."
      />
    </div>
  );
};
