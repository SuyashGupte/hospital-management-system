import React, { useState, useEffect } from 'react';
import {
  Tile,
  Grid,
  Column,
  Button,
  Tag,
  InlineNotification,
} from '@carbon/react';
import { Password, UserMultiple, Education, Enterprise } from '@carbon/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import type { Employee } from '../../api/types';
import { ChangePasswordModal } from './ChangePasswordModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatRoleLabel } from '../../utils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const UserProfile: React.FC = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(authUser);
  const [loading, setLoading] = useState<boolean>(!authUser);
  const [error, setError] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await authService.getCurrentUser();
        setProfile(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <LoadingSpinner description="Loading staff profile details..." />;
  }

  if (!profile) {
    return (
      <InlineNotification
        kind="error"
        title="Profile Error"
        subtitle="Could not retrieve current staff profile information."
      />
    );
  }

  const qualifications = profile.qualifications || [];
  const experiences = profile.workExperinces || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Staff Profile & Credentials</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Personal employee record, academic qualifications, employment history, and security credentials.
          </p>
        </div>
        <Button
          kind="secondary"
          renderIcon={Password}
          onClick={() => setPasswordModalOpen(true)}
        >
          Change Account Password
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

      {/* Main Profile Info Card */}
      <Tile style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar Photo */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: 'var(--cds-layer-02)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid var(--cds-border-subtle)',
              flexShrink: 0,
            }}
          >
            {profile.photo ? (
              <img src={profile.photo} alt={profile.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserMultiple size={48} style={{ color: 'var(--cds-icon-secondary)' }} />
            )}
          </div>

          {/* Details Column */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                {profile.firstName} {profile.fatherName} {profile.familyName}
              </h2>
              <Tag type="blue" size="md">{formatRoleLabel(profile.type)}</Tag>
              <Tag type="cool-gray" size="md">@{profile.userName}</Tag>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block' }}>EMAIL ADDRESS</span>
                <span style={{ fontWeight: 500 }}>{profile.email || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block' }}>PHONE NUMBER</span>
                <span style={{ fontWeight: 500 }}>{profile.phone || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block' }}>RESIDENTIAL ADDRESS</span>
                <span style={{ fontWeight: 500 }}>{profile.address || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block' }}>DATE OF BIRTH & GENDER</span>
                <span style={{ fontWeight: 500 }}>{profile.dob || '—'} ({profile.gender || '—'})</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block' }}>STAFF CATEGORY</span>
                <span style={{ fontWeight: 500 }}>{profile.category?.categoryName || 'General Staff'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block' }}>JOIN DATE</span>
                <span style={{ fontWeight: 500 }}>{formatDisplayDate(profile.joinDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </Tile>

      {/* Qualifications & Experiences Grid */}
      <Grid narrow fullWidth style={{ padding: 0 }}>
        {/* Qualifications */}
        <Column sm={4} md={8} lg={6} style={{ marginBottom: '1.5rem' }}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Education size={20} style={{ color: 'var(--cds-interactive)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                Academic Qualifications ({qualifications.length})
              </h3>
            </div>

            {qualifications.length === 0 ? (
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                No academic qualifications recorded.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {qualifications.map((q, idx) => (
                  <div key={q.id || idx} style={{ padding: '0.75rem', backgroundColor: 'var(--cds-layer-01)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600 }}>{q.qualificationName}</span>
                      <Tag size="sm" type="cyan">{q.educationDate}</Tag>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                      {q.degree} &bull; {q.instituteName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tile>
        </Column>

        {/* Work Experiences */}
        <Column sm={4} md={8} lg={6} style={{ marginBottom: '1.5rem' }}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Enterprise size={20} style={{ color: 'var(--cds-interactive)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                Employment History ({experiences.length})
              </h3>
            </div>

            {experiences.length === 0 ? (
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                No prior work experience recorded.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {experiences.map((exp, idx) => (
                  <div key={exp.id || idx} style={{ padding: '0.75rem', backgroundColor: 'var(--cds-layer-01)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600 }}>{exp.position}</span>
                      <Tag size="sm" type="warm-gray">{exp.startDate} &rarr; {exp.endDate}</Tag>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                      {exp.nameOfOrganization}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tile>
        </Column>
      </Grid>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
};
