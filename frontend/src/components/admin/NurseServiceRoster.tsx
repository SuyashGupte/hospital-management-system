import React, { useState, useEffect } from 'react';
import {
  Grid,
  Column,
  Tile,
  Form,
  TextInput,
  Select,
  SelectItem,
  Button,
  InlineNotification,
  IconButton,
  Tag,
} from '@carbon/react';
import { Add, Edit, TrashCan } from '@carbon/icons-react';
import type {
  NurseServiceTime,
  Employee,
  ShiftTime,
  ServiceTimeRequest,
} from '../../api/types';
import { facilityService } from '../../services/facilityService';
import { employeeService } from '../../services/employeeService';
import { referenceService } from '../../services/referenceService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { isValidDateString } from '../../utils/validationUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const NurseServiceRoster: React.FC = () => {
  const [serviceTimes, setServiceTimes] = useState<NurseServiceTime[]>([]);
  const [nurses, setNurses] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states (Add/Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nurseId, setNurseId] = useState<number | ''>('');
  const [shiftTimeId, setShiftTimeId] = useState<number | ''>('');
  const [serviceDate, setServiceDate] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [deletingItem, setDeletingItem] = useState<NurseServiceTime | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { notifySuccess, notifyError } = useNotification();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesData, nursesData, shiftsData] = await Promise.all([
        facilityService.getNurseServiceTimes(),
        employeeService.getAllEmployees('Nurse'),
        referenceService.getShiftTimes(),
      ]);
      setServiceTimes(servicesData || []);
      setNurses(nursesData || []);
      setShifts(shiftsData || []);

      if (nursesData && nursesData.length > 0 && nurseId === '') {
        setNurseId(nursesData[0].id || 1);
      }
      if (shiftsData && shiftsData.length > 0 && shiftTimeId === '') {
        setShiftTimeId(shiftsData[0].id || 1);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    if (nurses.length > 0) setNurseId(nurses[0].id || 1);
    if (shifts.length > 0) setShiftTimeId(shifts[0].id || 1);
    setServiceDate('');
    setDepartment('');
    setFormError(null);
  };

  const handleStartEdit = (item: NurseServiceTime) => {
    setIsEditing(true);
    setEditingId(item.id || null);
    setNurseId(item.nurse?.id || (nurses[0]?.id ?? 1));
    setShiftTimeId(item.shiftTime?.id || (shifts[0]?.id ?? 1));
    setServiceDate(item.serviceDate || '');
    setDepartment(item.department || '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nurseId) {
      setFormError('Please select a Nurse.');
      return;
    }
    if (!shiftTimeId) {
      setFormError('Please select a Shift Time.');
      return;
    }
    if (!serviceDate.trim() || !isValidDateString(serviceDate)) {
      setFormError('Service Date is required in MM/dd/yyyy format (e.g. 10/24/2025).');
      return;
    }
    if (!department.trim()) {
      setFormError('Department name is required (e.g. Emergency, Pediatrics, ICU).');
      return;
    }

    const payload: ServiceTimeRequest = {
      nurseId: Number(nurseId),
      shiftTimeId: Number(shiftTimeId),
      serviceDate: serviceDate.trim(),
      department: department.trim(),
    };

    setFormLoading(true);
    try {
      if (isEditing && editingId) {
        await facilityService.updateNurseServiceTime(editingId, payload);
        notifySuccess('Roster Updated', 'Nurse service schedule was successfully updated.');
      } else {
        await facilityService.createNurseServiceTime(payload);
        notifySuccess('Shift Assigned', 'Nurse shift schedule assignment was successfully added.');
      }
      resetForm();
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id) return;
    setDeleteLoading(true);
    try {
      await facilityService.deleteNurseServiceTime(deletingItem.id);
      notifySuccess('Schedule Removed', 'Shift assignment was removed from the roster.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      notifyError('Failed to remove shift', getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: ColumnDef<NurseServiceTime>[] = [
    {
      key: 'nurse',
      header: 'Nurse Name',
      sortable: true,
      render: (s) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {s.nurse?.firstName} {s.nurse?.fatherName} {s.nurse?.familyName}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            Phone: {s.nurse?.phone || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'serviceDate',
      header: 'Duty Date',
      sortable: true,
      render: (s) => (
        <span style={{ fontWeight: 500 }}>
          {formatDisplayDate(s.serviceDate)}
        </span>
      ),
    },
    {
      key: 'shiftTime',
      header: 'Shift Hours',
      render: (s) => (
        <Tag type="cyan">
          {s.shiftTime?.fromTime || '—'} - {s.shiftTime?.toTime || '—'}
        </Tag>
      ),
    },
    {
      key: 'department',
      header: 'Ward / Department',
      sortable: true,
      render: (s) => s.department,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <IconButton
            label="Edit Shift"
            kind="ghost"
            size="sm"
            onClick={() => handleStartEdit(s)}
          >
            <Edit />
          </IconButton>
          <IconButton
            label="Delete Shift"
            kind="ghost"
            size="sm"
            onClick={() => setDeletingItem(s)}
          >
            <TrashCan />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading nurse duty roster..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Nurse Shift & Service Roster</h1>
        <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
          Assign and manage duty schedules, shift hours, and ward allocations for nursing staff.
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

      <Grid narrow fullWidth style={{ padding: 0 }}>
        {/* Form Panel (Assign / Edit Shift) */}
        <Column sm={4} md={8} lg={4} style={{ marginBottom: '1.5rem' }}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {isEditing ? 'Update Shift Assignment' : 'Assign Nurse Shift'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
              {isEditing
                ? 'Modify date, time window, or assigned department'
                : 'Schedule a nurse for an upcoming duty rotation'}
            </p>

            {formError && (
              <InlineNotification
                kind="error"
                title="Validation Error"
                subtitle={formError}
                style={{ marginBottom: '1rem' }}
              />
            )}

            <Form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Select
                  id="nurseId"
                  labelText="Select Nurse *"
                  value={nurseId}
                  onChange={(e) => setNurseId(Number(e.target.value))}
                >
                  {nurses.map((n) => (
                    <SelectItem
                      key={n.id}
                      value={n.id}
                      text={`${n.firstName} ${n.fatherName} ${n.familyName}`}
                    />
                  ))}
                </Select>

                <Select
                  id="shiftTimeId"
                  labelText="Shift Hours Window *"
                  value={shiftTimeId}
                  onChange={(e) => setShiftTimeId(Number(e.target.value))}
                >
                  {shifts.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      text={`${s.fromTime} to ${s.toTime}`}
                    />
                  ))}
                </Select>

                <TextInput
                  id="serviceDate"
                  labelText="Service Date (MM/dd/yyyy) *"
                  placeholder="MM/dd/yyyy (e.g. 10/24/2025)"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  required
                />

                <TextInput
                  id="department"
                  labelText="Department / Ward *"
                  placeholder="e.g. ICU, Emergency, Surgery Ward"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button
                    type="submit"
                    kind="primary"
                    disabled={formLoading}
                    renderIcon={isEditing ? Edit : Add}
                    style={{ flex: 1 }}
                  >
                    {formLoading ? 'Saving...' : isEditing ? 'Update Schedule' : 'Assign Shift'}
                  </Button>
                  {isEditing && (
                    <Button
                      type="button"
                      kind="secondary"
                      onClick={resetForm}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          </Tile>
        </Column>

        {/* Schedule Table */}
        <Column sm={4} md={8} lg={8} style={{ marginBottom: '1.5rem' }}>
          <SearchableTable
            title={`Active Duty Shifts (${serviceTimes.length})`}
            description="Nurse duty assignments across all medical departments"
            rows={serviceTimes}
            columns={columns}
            searchPlaceholder="Search schedule by nurse name, department, date..."
          />
        </Column>
      </Grid>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingItem)}
        title="Confirm Shift Removal"
        modalHeading="Remove Shift Assignment"
        danger
        primaryButtonText="Remove Shift"
        loading={deleteLoading}
        onRequestClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to remove the shift assignment for{' '}
          <strong>
            {deletingItem?.nurse?.firstName} {deletingItem?.nurse?.familyName}
          </strong>{' '}
          on <strong>{formatDisplayDate(deletingItem?.serviceDate)}</strong>?
        </p>
      </ConfirmModal>
    </div>
  );
};
