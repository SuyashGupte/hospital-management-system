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
import type { BookBed, Patient, Room, BookingRequest } from '../../api/types';
import { patientService } from '../../services/patientService';
import { facilityService } from '../../services/facilityService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const BedBookingManagement: React.FC = () => {
  const [bookedBeds, setBookedBeds] = useState<BookBed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states (Book / Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | ''>('');
  const [roomId, setRoomId] = useState<number | ''>('');
  const [departement, setDepartement] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete / Release Booking state
  const [deletingBooking, setDeletingBooking] = useState<BookBed | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { notifySuccess, notifyError } = useNotification();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bookingsData, patientsData, roomsData] = await Promise.all([
        patientService.getBookedBeds(),
        patientService.getAllPatients(),
        facilityService.getAvailableRooms(),
      ]);
      setBookedBeds(bookingsData || []);
      setPatients(patientsData || []);
      setAvailableRooms(roomsData || []);

      if (patientsData && patientsData.length > 0 && patientId === '') {
        setPatientId(patientsData[0].id || 1);
      }
      if (roomsData && roomsData.length > 0 && roomId === '') {
        setRoomId(roomsData[0].id || 1);
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
    setEditingBookingId(null);
    if (patients.length > 0) setPatientId(patients[0].id || 1);
    if (availableRooms.length > 0) setRoomId(availableRooms[0].id || 1);
    setDepartement('');
    setFormError(null);
  };

  const handleStartEdit = (b: BookBed) => {
    setIsEditing(true);
    setEditingBookingId(b.id || null);
    setPatientId(b.patient?.id || (patients[0]?.id ?? 1));
    setRoomId(b.room?.id || (availableRooms[0]?.id ?? 1));
    setDepartement(b.departement || '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientId) {
      setFormError('Please select a patient for admission.');
      return;
    }
    if (!roomId) {
      setFormError('Please select an available ward room with open bed capacity.');
      return;
    }
    if (!departement.trim()) {
      setFormError('Please specify the admission ward/department name (e.g. ICU, General Ward, Surgery).');
      return;
    }

    const payload: BookingRequest = {
      patientId: Number(patientId),
      roomId: Number(roomId),
      departement: departement.trim(),
    };

    setFormLoading(true);
    try {
      if (isEditing && editingBookingId) {
        await patientService.updateBookedBed(editingBookingId, payload);
        notifySuccess('Booking Updated', 'Inpatient bed allocation has been updated.');
      } else {
        await patientService.bookBed(payload);
        notifySuccess('Bed Allocated', 'Inpatient bed has been booked and reserved successfully.');
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
    if (!deletingBooking?.id) return;
    setDeleteLoading(true);
    try {
      await patientService.cancelBookedBed(deletingBooking.id);
      notifySuccess('Bed Booking Cancelled', 'The bed has been released back into available inventory.');
      setDeletingBooking(null);
      fetchData();
    } catch (err) {
      notifyError('Failed to cancel booking', getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: ColumnDef<BookBed>[] = [
    {
      key: 'patient',
      header: 'Patient Name',
      sortable: true,
      render: (b) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {b.patient?.firstName} {b.patient?.fatherName} {b.patient?.familyName}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            Phone: {b.patient?.phone || '—'} &bull; Blood: {b.patient?.bloodGroup?.bloodGroup || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Allocated Room',
      sortable: true,
      render: (b) => (
        <div>
          <span style={{ fontWeight: 500 }}>Room #{b.room?.roomNumber}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {b.room?.roomType?.typeOfroom} (${b.room?.roomType?.roomCost}/day)
          </div>
        </div>
      ),
    },
    {
      key: 'departement',
      header: 'Department',
      sortable: true,
      render: (b) => b.departement,
    },
    {
      key: 'datePlaced',
      header: 'Admission Date',
      sortable: true,
      render: (b) => formatDisplayDate(b.datePlaced),
    },
    {
      key: 'status',
      header: 'Billing Status',
      render: (b) => (
        <Tag type={b.status ? 'green' : 'red'}>
          {b.status ? 'Paid & Settled' : 'Occupied / Unpaid'}
        </Tag>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <IconButton
            label="Edit Bed Booking"
            kind="ghost"
            size="sm"
            onClick={() => handleStartEdit(b)}
          >
            <Edit />
          </IconButton>
          <IconButton
            label="Release & Cancel Bed"
            kind="ghost"
            size="sm"
            onClick={() => setDeletingBooking(b)}
          >
            <TrashCan />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading bed booking roster and room occupancy..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Inpatient Bed Allocation & Admissions</h1>
        <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
          Assign admitted patients to available ward beds, track occupancy, and release beds upon discharge.
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
        {/* Form Panel (Book Bed) */}
        <Column sm={4} md={8} lg={4} style={{ marginBottom: '1.5rem' }}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {isEditing ? 'Update Bed Allocation' : 'Book Inpatient Bed'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
              {isEditing
                ? 'Modify patient admission room or ward'
                : 'Reserve an open bed in an inpatient ward'}
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
                  id="patientId"
                  labelText="Select Patient *"
                  value={patientId}
                  onChange={(e) => setPatientId(Number(e.target.value))}
                >
                  {patients.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      text={`${p.firstName} ${p.fatherName} ${p.familyName}`}
                    />
                  ))}
                </Select>

                <Select
                  id="roomId"
                  labelText="Select Available Room *"
                  value={roomId}
                  onChange={(e) => setRoomId(Number(e.target.value))}
                >
                  {availableRooms.length === 0 ? (
                    <SelectItem value="" text="No available rooms with open beds" disabled />
                  ) : (
                    availableRooms.map((r) => (
                      <SelectItem
                        key={r.id}
                        value={r.id}
                        text={`Room #${r.roomNumber} - ${r.roomType?.typeOfroom} (${r.numberOfAvailableBeds} free)`}
                      />
                    ))
                  )}
                </Select>

                <TextInput
                  id="departement"
                  labelText="Department / Ward *"
                  placeholder="e.g. Intensive Care Unit, Cardiology"
                  value={departement}
                  onChange={(e) => setDepartement(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button
                    type="submit"
                    kind="primary"
                    disabled={formLoading || availableRooms.length === 0}
                    renderIcon={isEditing ? Edit : Add}
                    style={{ flex: 1 }}
                  >
                    {formLoading ? 'Processing...' : isEditing ? 'Update Booking' : 'Book Bed'}
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

        {/* Bookings Table */}
        <Column sm={4} md={8} lg={8} style={{ marginBottom: '1.5rem' }}>
          <SearchableTable
            title={`Active Bed Allocations (${bookedBeds.length})`}
            description="Directory of currently occupied hospital beds and admission timestamps"
            rows={bookedBeds}
            columns={columns}
            searchPlaceholder="Search bookings by patient, room number, department..."
          />
        </Column>
      </Grid>

      {/* Delete / Cancel Booking Modal */}
      <ConfirmModal
        open={Boolean(deletingBooking)}
        title="Confirm Bed Release & Cancel Booking"
        modalHeading="Release Inpatient Bed"
        danger
        primaryButtonText="Release Bed"
        loading={deleteLoading}
        onRequestClose={() => setDeletingBooking(null)}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to cancel the bed booking for patient{' '}
          <strong>
            {deletingBooking?.patient?.firstName} {deletingBooking?.patient?.familyName}
          </strong>{' '}
          in <strong>Room #{deletingBooking?.room?.roomNumber}</strong>?
        </p>
        <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          This will decrement the room occupancy counter and mark the bed as immediately available for new admissions.
        </p>
      </ConfirmModal>
    </div>
  );
};
