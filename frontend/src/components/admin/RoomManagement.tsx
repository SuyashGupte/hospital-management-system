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
import type { Room, RoomType, RoomRequest } from '../../api/types';
import { facilityService } from '../../services/facilityService';
import { referenceService } from '../../services/referenceService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';

export const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states (Add/Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [roomNumber, setRoomNumber] = useState<number | ''>('');
  const [bedNumbers, setBedNumbers] = useState<number | ''>(1);
  const [roomTypeId, setRoomTypeId] = useState<number | ''>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { notifySuccess, notifyError } = useNotification();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomsData, typesData] = await Promise.all([
        facilityService.getAllRooms(),
        referenceService.getRoomTypes(),
      ]);
      setRooms(roomsData || []);
      setRoomTypes(typesData || []);
      if (typesData && typesData.length > 0 && roomTypeId === '') {
        setRoomTypeId(typesData[0].id || 1);
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
    setEditingRoomId(null);
    setRoomNumber('');
    setBedNumbers(1);
    if (roomTypes.length > 0) {
      setRoomTypeId(roomTypes[0].id || 1);
    }
    setFormError(null);
  };

  const handleStartEdit = (room: Room) => {
    setIsEditing(true);
    setEditingRoomId(room.id || null);
    setRoomNumber(room.roomNumber);
    setBedNumbers(room.numberOfBeds);
    setRoomTypeId(room.roomType?.id || (roomTypes[0]?.id ?? 1));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (roomNumber === '' || Number(roomNumber) <= 0) {
      setFormError('Please provide a valid positive Room Number.');
      return;
    }
    if (bedNumbers === '' || Number(bedNumbers) <= 0) {
      setFormError('Please specify at least 1 Bed.');
      return;
    }
    if (!roomTypeId) {
      setFormError('Please select a Room Type.');
      return;
    }

    const payload: RoomRequest = {
      roomNumber: Number(roomNumber),
      bedNumbers: Number(bedNumbers),
      roomTypeId: Number(roomTypeId),
    };

    setFormLoading(true);
    try {
      if (isEditing && editingRoomId) {
        await facilityService.updateRoom(editingRoomId, payload);
        notifySuccess('Room Updated', `Room #${roomNumber} was successfully updated.`);
      } else {
        await facilityService.createRoom(payload);
        notifySuccess('Room Added', `Room #${roomNumber} was added to the hospital inventory.`);
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
    if (!deletingRoom?.id) return;
    setDeleteLoading(true);
    try {
      await facilityService.deleteRoom(deletingRoom.id);
      notifySuccess('Room Deleted', `Room #${deletingRoom.roomNumber} and its bookings were removed.`);
      setDeletingRoom(null);
      fetchData();
    } catch (err) {
      notifyError('Failed to delete room', getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: ColumnDef<Room>[] = [
    {
      key: 'roomNumber',
      header: 'Room Number',
      sortable: true,
      render: (r) => (
        <span style={{ fontWeight: 600, fontSize: '1rem' }}>
          Room #{r.roomNumber}
        </span>
      ),
    },
    {
      key: 'roomType',
      header: 'Room Classification',
      render: (r) => (
        <div>
          <span>{r.roomType?.typeOfroom || 'Standard'}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            Rate: ${r.roomType?.roomCost || 0} / day
          </div>
        </div>
      ),
    },
    {
      key: 'numberOfBeds',
      header: 'Total Capacity',
      sortable: true,
      render: (r) => `${r.numberOfBeds} Beds`,
    },
    {
      key: 'numberOfAvailableBeds',
      header: 'Available Beds',
      sortable: true,
      render: (r) => {
        const available = r.numberOfAvailableBeds;
        const isFull = available <= 0;
        return (
          <Tag type={isFull ? 'red' : available === r.numberOfBeds ? 'green' : 'teal'}>
            {available} of {r.numberOfBeds} Free
          </Tag>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <IconButton
            label="Edit Room"
            kind="ghost"
            size="sm"
            onClick={() => handleStartEdit(r)}
          >
            <Edit />
          </IconButton>
          <IconButton
            label="Delete Room"
            kind="ghost"
            size="sm"
            onClick={() => setDeletingRoom(r)}
          >
            <TrashCan />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading room and bed inventory..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Room & Facility Management</h1>
        <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
          Configure hospital rooms, ward bed capacities, and room tier classifications.
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
        {/* Form Panel (Add / Edit) */}
        <Column sm={4} md={8} lg={4} style={{ marginBottom: '1.5rem' }}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {isEditing ? `Edit Room #${roomNumber}` : 'Add New Room'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
              {isEditing
                ? 'Update room specifications and bed numbers'
                : 'Register a new ward room with bed allocations'}
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
                <TextInput
                  id="roomNumber"
                  type="number"
                  labelText="Room Number *"
                  placeholder="e.g. 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />

                <TextInput
                  id="bedNumbers"
                  type="number"
                  labelText="Number of Beds *"
                  placeholder="e.g. 4"
                  value={bedNumbers}
                  onChange={(e) => setBedNumbers(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />

                <Select
                  id="roomTypeId"
                  labelText="Room Type Classification *"
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(Number(e.target.value))}
                >
                  {roomTypes.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      text={`${t.typeOfroom} ($${t.roomCost}/day)`}
                    />
                  ))}
                </Select>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button
                    type="submit"
                    kind="primary"
                    disabled={formLoading}
                    renderIcon={isEditing ? Edit : Add}
                    style={{ flex: 1 }}
                  >
                    {formLoading ? 'Saving...' : isEditing ? 'Update Room' : 'Add Room'}
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

        {/* Rooms Table */}
        <Column sm={4} md={8} lg={8} style={{ marginBottom: '1.5rem' }}>
          <SearchableTable
            title={`Hospital Rooms (${rooms.length})`}
            description="Directory of inpatient rooms, occupancy levels, and pricing tiers"
            rows={rooms}
            columns={columns}
            searchPlaceholder="Search rooms by number, type..."
          />
        </Column>
      </Grid>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingRoom)}
        title="Confirm Room Deletion"
        modalHeading="Delete Room"
        danger
        primaryButtonText="Delete Room"
        loading={deleteLoading}
        onRequestClose={() => setDeletingRoom(null)}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to delete <strong>Room #{deletingRoom?.roomNumber}</strong>?
        </p>
        <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Deleting this room will also release and delete any existing active bed bookings associated with it.
        </p>
      </ConfirmModal>
    </div>
  );
};
