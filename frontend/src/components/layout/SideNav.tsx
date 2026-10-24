import React from 'react';
import {
  SideNav as CarbonSideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  SideNavMenuItem,
} from '@carbon/react';
import {
  Dashboard,
  UserMultiple,
  Hotel,
  Time,
  Events,
  Enterprise,
  Money,
  Email,
  UserSettings,
} from '@carbon/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

interface SideNavProps {
  isExpanded: boolean;
}

export const SideNav: React.FC<SideNavProps> = ({ isExpanded }) => {
  const { role, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const userRole = role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';
  const isReceptionist = userRole.includes('reception');
  const isDoctor = userRole === 'doctor';
  const isNurse = userRole === 'nurse';
  const isPharmacist = userRole.includes('pharm');
  const isAccountant = userRole === 'accountant';
  const isLabOrXray = userRole === 'lab' || userRole === 'xray';

  const isActive = (path: string) => location.pathname === path;

  return (
    <CarbonSideNav
      aria-label="Side navigation"
      expanded={isExpanded}
      isPersistent={true}
      isFixedNav={false}
    >
      <SideNavItems>
        <SideNavLink
          as={Link}
          to={ROUTES.HOME}
          renderIcon={Dashboard}
          isActive={isActive(ROUTES.HOME)}
        >
          Dashboard
        </SideNavLink>

        {/* Admin Navigation */}
        {isAdmin && (
          <SideNavMenu renderIcon={Enterprise} title="Administration" defaultExpanded>
            <SideNavMenuItem as={Link} to={ROUTES.ADMIN_DASHBOARD} isActive={isActive(ROUTES.ADMIN_DASHBOARD)}>
              Dashboard & Reports
            </SideNavMenuItem>
            <SideNavMenuItem as={Link} to={ROUTES.ADMIN_EMPLOYEES} isActive={isActive(ROUTES.ADMIN_EMPLOYEES)}>
              Employee Management
            </SideNavMenuItem>
            <SideNavMenuItem as={Link} to={ROUTES.ADMIN_ROOMS} isActive={isActive(ROUTES.ADMIN_ROOMS)}>
              Room & Bed Management
            </SideNavMenuItem>
            <SideNavMenuItem as={Link} to={ROUTES.ADMIN_SERVICE_TIMES} isActive={isActive(ROUTES.ADMIN_SERVICE_TIMES)}>
              Nurse Shift Roster
            </SideNavMenuItem>
          </SideNavMenu>
        )}

        {/* Receptionist Navigation */}
        {(isAdmin || isReceptionist) && (
          <SideNavMenu renderIcon={UserMultiple} title="Reception" defaultExpanded={isReceptionist}>
            <SideNavMenuItem as={Link} to={ROUTES.RECEPTION_PATIENTS} isActive={isActive(ROUTES.RECEPTION_PATIENTS)}>
              Patient Registry
            </SideNavMenuItem>
            <SideNavMenuItem as={Link} to={ROUTES.RECEPTION_BOOK_BED} isActive={isActive(ROUTES.RECEPTION_BOOK_BED)}>
              Bed Bookings
            </SideNavMenuItem>
          </SideNavMenu>
        )}

        {/* Doctor Clinical Diagnoses */}
        {(isAdmin || isDoctor) && (
          <SideNavLink
            as={Link}
            to={ROUTES.DOCTOR_DIAGNOSES}
            renderIcon={Events}
            isActive={isActive(ROUTES.DOCTOR_DIAGNOSES)}
          >
            Clinical Diagnoses
          </SideNavLink>
        )}

        {/* Nurse Shifts and Patient Views */}
        {(isAdmin || isNurse || isLabOrXray) && (
          <SideNavMenu renderIcon={Time} title="Clinical & Wards" defaultExpanded={isNurse || isLabOrXray}>
            {(isAdmin || isNurse) && (
              <SideNavMenuItem as={Link} to={ROUTES.NURSE_SERVICE_TIMES} isActive={isActive(ROUTES.NURSE_SERVICE_TIMES)}>
                Nurse Service Schedule
              </SideNavMenuItem>
            )}
            <SideNavMenuItem as={Link} to={ROUTES.VIEW_PATIENTS} isActive={isActive(ROUTES.VIEW_PATIENTS)}>
              Patient & Diagnosis Directory
            </SideNavMenuItem>
          </SideNavMenu>
        )}

        {/* Pharmacy Navigation */}
        {(isAdmin || isPharmacist) && (
          <SideNavMenu renderIcon={Hotel} title="Pharmacy" defaultExpanded={isPharmacist}>
            <SideNavMenuItem as={Link} to={ROUTES.PHARMACY_DRUGS} isActive={isActive(ROUTES.PHARMACY_DRUGS)}>
              Drug Inventory
            </SideNavMenuItem>
            <SideNavMenuItem as={Link} to={ROUTES.PHARMACY_SALES} isActive={isActive(ROUTES.PHARMACY_SALES)}>
              Dispensing & Invoicing
            </SideNavMenuItem>
          </SideNavMenu>
        )}

        {/* Accountant Navigation */}
        {(isAdmin || isAccountant) && (
          <SideNavLink
            as={Link}
            to={ROUTES.ACCOUNTANT_FEES}
            renderIcon={Money}
            isActive={isActive(ROUTES.ACCOUNTANT_FEES)}
          >
            Patient Fee Billing
          </SideNavLink>
        )}

        {/* Messaging Navigation */}
        <SideNavMenu renderIcon={Email} title="Internal Messaging">
          <SideNavMenuItem as={Link} to={ROUTES.MESSAGES_INBOX} isActive={isActive(ROUTES.MESSAGES_INBOX)}>
            Inbox
          </SideNavMenuItem>
          <SideNavMenuItem as={Link} to={ROUTES.MESSAGES_SENT} isActive={isActive(ROUTES.MESSAGES_SENT)}>
            Sent Messages
          </SideNavMenuItem>
          <SideNavMenuItem as={Link} to={ROUTES.MESSAGES_COMPOSE} isActive={isActive(ROUTES.MESSAGES_COMPOSE)}>
            Compose Message
          </SideNavMenuItem>
        </SideNavMenu>

        {/* Profile Settings */}
        <SideNavLink
          as={Link}
          to={ROUTES.PROFILE}
          renderIcon={UserSettings}
          isActive={isActive(ROUTES.PROFILE)}
        >
          My Profile
        </SideNavLink>
      </SideNavItems>
    </CarbonSideNav>
  );
};
