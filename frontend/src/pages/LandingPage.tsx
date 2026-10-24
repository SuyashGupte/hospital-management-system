import React, { useEffect, useState } from 'react';
import {
  Grid,
  Column,
  Tile,
  ClickableTile,
  Button,
  Tag,
  InlineLoading,
} from '@carbon/react';
import {
  UserMultiple,
  Hotel,
  Money,
  Events,
  Enterprise,
  Time,
  Email,
  ArrowRight,
  Login,
  UserFollow,
  CheckmarkOutline,
  WarningAlt,
} from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { referenceService } from '../services/referenceService';
import { messageService } from '../services/messageService';
import { ROUTES, formatRoleLabel } from '../utils';

/** Returns the role-appropriate default route for the authenticated user */
function getRoleLandingPath(role?: string | null): string {
  if (!role) return ROUTES.HOME;
  const r = role.toLowerCase();
  if (r === 'admin') return ROUTES.ADMIN_DASHBOARD;
  if (r === 'doctor') return ROUTES.DOCTOR_DIAGNOSES;
  if (r.includes('pharm')) return ROUTES.PHARMACY_DRUGS;
  if (r.includes('reception')) return ROUTES.RECEPTION_PATIENTS;
  if (r === 'accountant') return ROUTES.ACCOUNTANT_FEES;
  if (r === 'nurse') return ROUTES.NURSE_SERVICE_TIMES;
  if (r === 'lab' || r === 'xray') return ROUTES.VIEW_PATIENTS;
  return ROUTES.HOME;
}

export const LandingPage: React.FC = () => {
  const { user, role, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Auto-redirect authenticated users to their role-specific module
  useEffect(() => {
    if (isAuthenticated && role) {
      const landingPath = getRoleLandingPath(role);
      // Only redirect if the role has a specific module (not the generic home)
      if (landingPath !== ROUTES.HOME) {
        navigate(landingPath, { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        await referenceService.getPublicBloodGroups();
        if (isMounted) setBackendStatus('connected');
      } catch {
        if (isMounted) setBackendStatus('disconnected');
      }
    };

    checkBackend();

    if (isAuthenticated) {
      messageService.getUnreadCount()
        .then((count) => {
          if (isMounted) setUnreadCount(count);
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleNavigate = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate(ROUTES.LOGIN, { state: { from: { pathname: path } } });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Hero Welcome Banner */}
      <Tile style={{ padding: '2.5rem', marginBottom: '2rem', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>
                Hospital Management System
              </h1>
              <Tag type="blue" size="md">V2 React Modernized</Tag>
            </div>
            <p style={{ fontSize: '1.125rem', color: 'var(--cds-text-secondary)', maxWidth: '650px', marginTop: '0.5rem' }}>
              Enterprise medical facility and clinical operations platform with role-based access for
              administrators, doctors, nurses, pharmacists, receptionists, and accountants.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Backend API:</span>
              {backendStatus === 'checking' && (
                <InlineLoading description="Checking..." status="active" />
              )}
              {backendStatus === 'connected' && (
                <Tag type="green" renderIcon={CheckmarkOutline}>Online (Spring Boot)</Tag>
              )}
              {backendStatus === 'disconnected' && (
                <Tag type="red" renderIcon={WarningAlt}>Offline / Connecting</Tag>
              )}
            </div>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem' }}>
                  Signed in as <strong>{user?.firstName} {user?.familyName}</strong> ({formatRoleLabel(user?.type)})
                </span>
                <Button size="md" kind="tertiary" onClick={() => navigate(ROUTES.PROFILE)}>
                  My Profile
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button
                  renderIcon={Login}
                  size="md"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </Tile>

      {/* Role and Module Quick Navigation Grid */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
        Operational Modules & Workflows
      </h2>

      <Grid narrow fullWidth style={{ padding: 0 }}>
        {/* Admin Section */}
        <Column sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
          <ClickableTile
            onClick={() => handleNavigate(ROUTES.ADMIN_EMPLOYEES)}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Enterprise size={32} style={{ color: 'var(--cds-interactive)' }} />
                <Tag type="purple">Admin</Tag>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Staff & Administration</h3>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                Manage staff profiles, qualifications, work experiences, hospital rooms, and nurse shift rosters.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--cds-link-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <span>Access Module</span>
              <ArrowRight size={16} />
            </div>
          </ClickableTile>
        </Column>

        {/* Receptionist Section */}
        <Column sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
          <ClickableTile
            onClick={() => handleNavigate(ROUTES.RECEPTION_PATIENTS)}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <UserMultiple size={32} style={{ color: 'var(--cds-interactive)' }} />
                <Tag type="teal">Reception</Tag>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Patient & Bed Admissions</h3>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                Register new patients, manage next of kin details, and allocate available room beds for admissions.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--cds-link-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <span>Access Module</span>
              <ArrowRight size={16} />
            </div>
          </ClickableTile>
        </Column>

        {/* Doctor Section */}
        <Column sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
          <ClickableTile
            onClick={() => handleNavigate(ROUTES.DOCTOR_DIAGNOSES)}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Events size={32} style={{ color: 'var(--cds-interactive)' }} />
                <Tag type="magenta">Doctor</Tag>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Clinical Diagnoses</h3>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                Record and update disease diagnoses, physician notes, and patient medical histories.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--cds-link-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <span>Access Module</span>
              <ArrowRight size={16} />
            </div>
          </ClickableTile>
        </Column>

        {/* Pharmacy Section */}
        <Column sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
          <ClickableTile
            onClick={() => handleNavigate(ROUTES.PHARMACY_DRUGS)}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Hotel size={32} style={{ color: 'var(--cds-interactive)' }} />
                <Tag type="green">Pharmacy</Tag>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Pharmacy & Invoicing</h3>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                Maintain medication inventory, dispense prescriptions with dosage instructions, and generate drug invoices.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--cds-link-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <span>Access Module</span>
              <ArrowRight size={16} />
            </div>
          </ClickableTile>
        </Column>

        {/* Accountant Section */}
        <Column sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
          <ClickableTile
            onClick={() => handleNavigate(ROUTES.ACCOUNTANT_FEES)}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Money size={32} style={{ color: 'var(--cds-interactive)' }} />
                <Tag type="warm-gray">Accountant</Tag>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Patient Fee Billing</h3>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                Compute daily room stay charges, process patient checkouts, and reconcile facility payments.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--cds-link-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <span>Access Module</span>
              <ArrowRight size={16} />
            </div>
          </ClickableTile>
        </Column>

        {/* Nursing & Wards Section */}
        <Column sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
          <ClickableTile
            onClick={() => handleNavigate(ROUTES.NURSE_SERVICE_TIMES)}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Time size={32} style={{ color: 'var(--cds-interactive)' }} />
                <Tag type="cyan">Nursing & Wards</Tag>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nurse Shifts & Patient Views</h3>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                View nurse duty rotations, department schedules, and patient clinical records for nurse, lab, and xray staff.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--cds-link-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <span>Access Module</span>
              <ArrowRight size={16} />
            </div>
          </ClickableTile>
        </Column>

        {/* Messaging Section */}
        <Column sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
          <ClickableTile
            onClick={() => handleNavigate(ROUTES.MESSAGES_INBOX)}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Email size={32} style={{ color: 'var(--cds-interactive)' }} />
                <Tag type="cool-gray">Internal</Tag>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Staff Messaging {unreadCount > 0 && <Tag type="red" size="sm">{unreadCount} New</Tag>}
              </h3>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                Send internal messages to individual staff members or broadcast alerts to all receptionists regarding patient cases.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--cds-link-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <span>Open Inbox</span>
              <ArrowRight size={16} />
            </div>
          </ClickableTile>
        </Column>

        {/* Public Patient Registration */}
        <Column sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
          <ClickableTile
            onClick={() => handleNavigate(ROUTES.RECEPTION_PATIENTS)}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <UserFollow size={32} style={{ color: 'var(--cds-interactive)' }} />
                <Tag type="outline">Admissions</Tag>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Patient Pre-Registration</h3>
              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                Pre-register patient demographics and emergency contact information before arrival.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--cds-link-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
              <span>Patient Directory</span>
              <ArrowRight size={16} />
            </div>
          </ClickableTile>
        </Column>
      </Grid>
    </div>
  );
};
