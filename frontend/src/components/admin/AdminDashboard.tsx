import React, { useEffect, useState } from 'react';
import {
  Grid,
  Column,
  Tile,
  Button,
  Tag,
  InlineNotification,
  Modal,
} from '@carbon/react';
import {
  DocumentPdf,
  UserMultiple,
  Events,
  Time,
  Hotel,
  Money,
  UserFollow,
} from '@carbon/icons-react';
import { employeeService } from '../../services/employeeService';
import type { EmployeeStatistic } from '../../api/types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StatCard } from '../common/StatCard';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatRoleLabel } from '../../utils';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<EmployeeStatistic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotification();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getEmployeeStatistics();
      setStats(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalStaff = stats.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const getRoleIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('doctor')) return <Events size={24} />;
    if (t.includes('nurse')) return <Time size={24} />;
    if (t.includes('pharmacist') || t.includes('pharmatiest')) return <Hotel size={24} />;
    if (t.includes('accountant')) return <Money size={24} />;
    if (t.includes('reception')) return <UserFollow size={24} />;
    return <UserMultiple size={24} />;
  };

  const handleDownloadPdf = async (roleType: string) => {
    try {
      await employeeService.downloadReportPdf(roleType);
      notifySuccess('Report Generated', `Downloading ${formatRoleLabel(roleType)} staff report PDF...`);
    } catch (err) {
      notifyError('Failed to download report', getErrorMessage(err));
    }
  };

  if (loading) {
    return <LoadingSpinner description="Loading staff statistics and administrative overview..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>
            Executive Administrative Dashboard
          </h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Hospital staffing headcount, department statistics, and JasperReports PDF generation.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Tag type="teal" size="md">
            Total Staff Headcount: <strong>{totalStaff}</strong>
          </Tag>
          <Button
            kind="primary"
            size="md"
            renderIcon={DocumentPdf}
            onClick={() => setReportModalOpen(true)}
          >
            Export Staff Reports
          </Button>
        </div>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Error Loading Statistics"
          subtitle={error}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* Staff Statistics Grid */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
        Department Headcount & Roster Breakdown
      </h2>

      <Grid narrow fullWidth style={{ padding: 0 }}>
        {stats.length === 0 ? (
          <Column sm={4} md={8} lg={12}>
            <Tile style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--cds-text-secondary)' }}>No employee statistics records available.</p>
            </Tile>
          </Column>
        ) : (
          stats.map((stat, idx) => (
            <Column sm={4} md={4} lg={3} key={stat.type || idx} style={{ marginBottom: '1rem' }}>
              <StatCard
                title={formatRoleLabel(stat.type)}
                value={stat.count}
                subtitle="Active personnel"
                icon={getRoleIcon(stat.type)}
                badge={<Tag type="blue" size="sm">{stat.type}</Tag>}
              />
            </Column>
          ))
        )}
      </Grid>

      {/* Quick Report Download Actions */}
      <div style={{ marginTop: '1.5rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Direct PDF Report Downloads (JasperReports 7 Engine)
          </h3>
          <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Generate official printable PDF rosters and credentials lists filtered by role category.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {['Admin', 'Doctor', 'Nurse', 'pharmacist', 'Receptionist', 'Accountant', 'Lab', 'Xray'].map((role) => (
              <Button
                key={role}
                kind="tertiary"
                size="sm"
                renderIcon={DocumentPdf}
                onClick={() => handleDownloadPdf(role)}
              >
                {formatRoleLabel(role)} Report
              </Button>
            ))}
          </div>
        </Tile>
      </div>

      {/* PDF Export Selector Modal */}
      <Modal
        open={reportModalOpen}
        modalHeading="Export Staff PDF Report"
        primaryButtonText="Download PDF"
        secondaryButtonText="Cancel"
        onRequestSubmit={() => {
          if (selectedReportType) {
            handleDownloadPdf(selectedReportType);
            setReportModalOpen(false);
          }
        }}
        onRequestClose={() => setReportModalOpen(false)}
        primaryButtonDisabled={!selectedReportType}
      >
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Select the employee role category you would like to generate and export as a formatted PDF document.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {['Admin', 'Doctor', 'Nurse', 'pharmacist', 'Receptionist', 'Accountant', 'Lab', 'Xray'].map((role) => (
            <Tile
              key={role}
              onClick={() => setSelectedReportType(role)}
              style={{
                cursor: 'pointer',
                padding: '0.75rem 1rem',
                border: selectedReportType === role ? '2px solid var(--cds-interactive)' : '1px solid var(--cds-border-subtle)',
                backgroundColor: selectedReportType === role ? 'var(--cds-layer-02)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: selectedReportType === role ? 600 : 400 }}>
                {formatRoleLabel(role)} Department Roster
              </span>
              <Tag type={selectedReportType === role ? 'teal' : 'gray'}>{role}</Tag>
            </Tile>
          ))}
        </div>
      </Modal>
    </div>
  );
};
