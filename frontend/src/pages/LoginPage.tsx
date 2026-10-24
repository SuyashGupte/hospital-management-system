import React, { useState, useEffect } from 'react';
import {
  Form,
  TextInput,
  PasswordInput,
  Button,
  Tile,
  InlineNotification,
  Stack,
} from '@carbon/react';
import { Login, UserAvatar } from '@carbon/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errorUtils';
import { ROUTES } from '../utils/constants';

/** Returns the role-appropriate default landing route after login */
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

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, isAuthenticated, role } = useAuth();
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // Redirect already-authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated) {
      const destination = from || getRoleLandingPath(role);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, role, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ user: username.trim(), pass: password.trim() });
      notifySuccess('Login successful', `Welcome back, ${username}!`);
      // The useEffect above will handle role-based redirect after auth state updates
      // But provide fallback in case useEffect fires before navigate
      navigate(from || ROUTES.HOME, { replace: true });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '75vh',
        padding: '1rem',
      }}
    >
      <Tile
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2rem',
          borderRadius: '4px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--cds-layer-02)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <UserAvatar size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            Sign In to Hospital Portal
          </h2>
          <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Enter your credentials or username/email to continue
          </p>
        </div>

        {errorMessage && (
          <InlineNotification
            kind="error"
            title="Authentication Failed"
            subtitle={errorMessage}
            hideCloseButton
            style={{ marginBottom: '1.5rem', width: '100%' }}
          />
        )}

        <Form onSubmit={handleSubmit}>
          <Stack gap={6}>
            <TextInput
              id="username"
              labelText="Username or Email"
              placeholder="e.g. admin or admin@hospital.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />

            <PasswordInput
              id="password"
              labelText="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              renderIcon={Login}
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Stack>
        </Form>

      </Tile>
    </div>
  );
};
