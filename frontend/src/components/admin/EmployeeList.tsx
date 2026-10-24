import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Tag,
  InlineNotification,
  IconButton,
  Select,
  SelectItem,
} from '@carbon/react';
import { Add, Edit, TrashCan, DocumentPdf, UserMultiple } from '@carbon/icons-react';
import type { Employee } from '../../api/types';
import { employeeService } from '../../services/employeeService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmployeeFormModal } from './EmployeeFormModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatRoleLabel } from '../../utils';
import { useAuth } from '../../hooks/useAuth';

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: currentUser } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getAllEmployees();
      setEmployees(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    if (roleFilter === 'ALL') return employees;
    return employees.filter((e) => e.type?.toLowerCase() === roleFilter.toLowerCase());
  }, [employees, roleFilter]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEmployee?.id) return;
    setDeleteLoading(true);
    try {
      await employeeService.deleteEmployee(deletingEmployee.id);
      notifySuccess('Employee deleted', `Staff record for ${deletingEmployee.firstName} ${deletingEmployee.familyName} has been removed.`);
      setDeletingEmployee(null);
      fetchEmployees();
    } catch (err) {
      notifyError('Failed to delete employee', getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadPdf = async (role: string) => {
    try {
      await employeeService.downloadReportPdf(role);
      notifySuccess('Report Export', `Generating PDF for ${role} employees...`);
    } catch (err) {
      notifyError('Report Export Failed', getErrorMessage(err));
    }
  };

  const columns: ColumnDef<Employee>[] = [
    {
      key: 'photo',
      header: 'Photo',
      render: (emp) => (
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--cds-layer-02)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {emp.photo ? (
            <img src={emp.photo} alt={emp.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserMultiple size={18} />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Full Name',
      sortable: true,
      render: (emp) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {emp.firstName} {emp.fatherName} {emp.familyName}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            @{emp.userName} &bull; {emp.email}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Role',
      sortable: true,
      render: (emp) => {
        let tagType: 'blue' | 'green' | 'purple' | 'magenta' | 'teal' | 'warm-gray' = 'blue';
        const t = (emp.type || '').toLowerCase();
        if (t.includes('doctor')) tagType = 'magenta';
        else if (t.includes('nurse')) tagType = 'teal';
        else if (t.includes('pharmacist') || t.includes('pharmatiest')) tagType = 'green';
        else if (t.includes('admin')) tagType = 'purple';
        else if (t.includes('accountant')) tagType = 'warm-gray';

        return <Tag type={tagType}>{formatRoleLabel(emp.type)}</Tag>;
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (emp) => emp.category?.categoryName || 'General Staff',
    },
    {
      key: 'phone',
      header: 'Phone / Contact',
      render: (emp) => (
        <div>
          <span>{emp.phone || '—'}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{emp.address}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (emp) => {
        const isSelf = currentUser?.id === emp.id;
        return (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <IconButton
              label="Edit Employee"
              kind="ghost"
              size="sm"
              onClick={() => handleOpenEdit(emp)}
            >
              <Edit />
            </IconButton>
            <IconButton
              label={isSelf ? 'Cannot delete logged in user' : 'Delete Employee'}
              kind="ghost"
              size="sm"
              disabled={isSelf}
              onClick={() => setDeletingEmployee(emp)}
            >
              <TrashCan />
            </IconButton>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading hospital staff records..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Staff & Employee Management</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Manage staff profiles, qualifications, work experiences, and credentials directory.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button kind="primary" renderIcon={Add} onClick={handleOpenAdd}>
            Add New Employee
          </Button>
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

      {/* Role Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ width: '220px' }}>
          <Select
            id="role-filter"
            labelText="Filter by Job Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            size="sm"
          >
            <SelectItem value="ALL" text="All Roles (Entire Staff)" />
            <SelectItem value="Admin" text="Admin" />
            <SelectItem value="Doctor" text="Doctor" />
            <SelectItem value="Nurse" text="Nurse" />
            <SelectItem value="pharmacist" text="Pharmacist" />
            <SelectItem value="Receptionist" text="Receptionist" />
            <SelectItem value="Accountant" text="Accountant" />
            <SelectItem value="Lab" text="Lab Technician" />
            <SelectItem value="Xray" text="X-Ray Technician" />
          </Select>
        </div>

        {roleFilter !== 'ALL' && (
          <Button
            kind="tertiary"
            size="sm"
            renderIcon={DocumentPdf}
            style={{ marginTop: '1.5rem' }}
            onClick={() => handleDownloadPdf(roleFilter)}
          >
            Download {formatRoleLabel(roleFilter)} Report
          </Button>
        )}
      </div>

      {/* Employees Table */}
      <SearchableTable
        title={`Staff Directory (${filteredEmployees.length})`}
        description="Comprehensive list of hospital personnel across all medical and administrative departments"
        rows={filteredEmployees}
        columns={columns}
        searchPlaceholder="Search staff by name, username, email, phone, role..."
      />

      {/* Form Modal (Add / Edit) */}
      <EmployeeFormModal
        open={formModalOpen}
        employeeToEdit={editingEmployee}
        onClose={() => setFormModalOpen(false)}
        onSuccess={(saved) => {
          setFormModalOpen(false);
          notifySuccess(
            editingEmployee ? 'Employee Updated' : 'Employee Added',
            `Staff profile for ${saved.firstName} ${saved.familyName} saved successfully.`
          );
          fetchEmployees();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingEmployee)}
        title="Confirm Staff Member Removal"
        modalHeading="Delete Employee Record"
        danger
        primaryButtonText="Delete Staff Member"
        loading={deleteLoading}
        onRequestClose={() => setDeletingEmployee(null)}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to delete staff record for{' '}
          <strong>
            {deletingEmployee?.firstName} {deletingEmployee?.familyName}
          </strong>{' '}
          ({deletingEmployee?.type})?
        </p>
        <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          This action will permanently remove their user credentials, associated qualifications, work experiences,
          and internal message logs. This action cannot be undone.
        </p>
      </ConfirmModal>
    </div>
  );
};
