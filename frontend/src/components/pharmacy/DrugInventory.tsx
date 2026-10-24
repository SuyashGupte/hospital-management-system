import React, { useState, useEffect } from 'react';
import {
  Grid,
  Column,
  Tile,
  Form,
  TextInput,
  Button,
  InlineNotification,
  IconButton,
  Tag,
} from '@carbon/react';
import { Add, Edit, TrashCan, WarningAlt } from '@carbon/icons-react';
import type { Drug, DrugRequest } from '../../api/types';
import { pharmacyService } from '../../services/pharmacyService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { isValidDateString } from '../../utils/validationUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const DrugInventory: React.FC = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states (Add/Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState<string>('');
  const [cost, setCost] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [deletingDrug, setDeletingDrug] = useState<Drug | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { notifySuccess, notifyError } = useNotification();

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pharmacyService.getAllDrugs();
      setDrugs(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setCost('');
    setQuantity('');
    setStartDate('');
    setExpiryDate('');
    setFormError(null);
  };

  const handleStartEdit = (d: Drug) => {
    setIsEditing(true);
    setEditingId(d.id || null);
    setName(d.name || '');
    setCost(d.cost || 0);
    setQuantity(d.quantity || 0);
    setStartDate(d.startDate || '');
    setExpiryDate(d.drug_expired || '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Drug / Medication name is required.');
      return;
    }
    if (cost === '' || Number(cost) < 0) {
      setFormError('Valid non-negative drug unit cost is required.');
      return;
    }
    if (quantity === '' || Number(quantity) < 0) {
      setFormError('Valid non-negative inventory quantity is required.');
      return;
    }
    if (!startDate.trim() || !isValidDateString(startDate)) {
      setFormError('Start / Batch date is required in MM/dd/yyyy format (e.g. 01/15/2025).');
      return;
    }
    if (!expiryDate.trim() || !isValidDateString(expiryDate)) {
      setFormError('Expiry date is required in MM/dd/yyyy format (e.g. 12/31/2026).');
      return;
    }

    const payload: DrugRequest = {
      name: name.trim(),
      cost: Number(cost),
      quantity: Number(quantity),
      startDate: startDate.trim(),
      expiryDate: expiryDate.trim(),
    };

    setFormLoading(true);
    try {
      if (isEditing && editingId) {
        await pharmacyService.updateDrug(editingId, payload);
        notifySuccess('Drug Updated', `Medication "${name}" inventory specifications updated.`);
      } else {
        await pharmacyService.createDrug(payload);
        notifySuccess('Drug Added', `Medication "${name}" added to pharmacy stock.`);
      }
      resetForm();
      fetchDrugs();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDrug?.id) return;
    setDeleteLoading(true);
    try {
      await pharmacyService.deleteDrug(deletingDrug.id);
      notifySuccess('Drug Removed', `Medication "${deletingDrug.name}" removed from inventory.`);
      setDeletingDrug(null);
      fetchDrugs();
    } catch (err) {
      notifyError('Failed to delete drug', getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const lowStockCount = drugs.filter((d) => d.quantity <= 50).length;

  const columns: ColumnDef<Drug>[] = [
    {
      key: 'name',
      header: 'Drug Name',
      sortable: true,
      render: (d) => (
        <div>
          <span style={{ fontWeight: 600 }}>{d.name}</span>
          {d.quantity <= 50 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <WarningAlt size={14} style={{ color: 'var(--cds-support-error)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--cds-support-error)', fontWeight: 600 }}>
                Low Stock Alert (&le; 50 units)
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'cost',
      header: 'Unit Cost',
      sortable: true,
      render: (d) => `$${Number(d.cost || 0).toFixed(2)}`,
    },
    {
      key: 'quantity',
      header: 'Stock Units',
      sortable: true,
      render: (d) => (
        <Tag type={d.quantity <= 20 ? 'red' : d.quantity <= 50 ? 'warm-gray' : 'green'}>
          {d.quantity} units in stock
        </Tag>
      ),
    },
    {
      key: 'startDate',
      header: 'Stock Date',
      render: (d) => formatDisplayDate(d.startDate),
    },
    {
      key: 'drug_expired',
      header: 'Expiry Date',
      sortable: true,
      render: (d) => (
        <span style={{ fontWeight: 500, color: 'var(--cds-text-primary)' }}>
          {formatDisplayDate(d.drug_expired)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <IconButton
            label="Edit Drug"
            kind="ghost"
            size="sm"
            onClick={() => handleStartEdit(d)}
          >
            <Edit />
          </IconButton>
          <IconButton
            label="Delete Drug"
            kind="ghost"
            size="sm"
            onClick={() => setDeletingDrug(d)}
          >
            <TrashCan />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading pharmacy drug inventory..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Pharmacy Drug Stock & Inventory</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Manage medication catalog, stock quantities, unit pricing, and drug expiry dates.
          </p>
        </div>
        {lowStockCount > 0 && (
          <Tag type="red" size="md">
            {lowStockCount} Item{lowStockCount === 1 ? '' : 's'} Low on Stock
          </Tag>
        )}
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
        {/* Form Panel (Add / Edit Drug) */}
        <Column sm={4} md={8} lg={4} style={{ marginBottom: '1.5rem' }}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {isEditing ? `Edit Medication` : 'Add New Medication'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
              {isEditing
                ? 'Update drug pricing, stock level, or expiration'
                : 'Register a new pharmaceutical item into inventory'}
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
                  id="drugName"
                  labelText="Drug / Brand Name *"
                  placeholder="e.g. Amoxicillin 500mg, Paracetamol"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <TextInput
                  id="drugCost"
                  type="number"
                  step="0.01"
                  labelText="Unit Cost ($) *"
                  placeholder="e.g. 12.50"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />

                <TextInput
                  id="drugQuantity"
                  type="number"
                  labelText="Inventory Quantity (Units) *"
                  placeholder="e.g. 100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />

                <TextInput
                  id="startDate"
                  labelText="Batch / Restock Date (MM/dd/yyyy) *"
                  placeholder="MM/dd/yyyy (e.g. 01/15/2025)"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />

                <TextInput
                  id="expiryDate"
                  labelText="Expiration Date (MM/dd/yyyy) *"
                  placeholder="MM/dd/yyyy (e.g. 12/31/2026)"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
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
                    {formLoading ? 'Saving...' : isEditing ? 'Update Stock' : 'Add Medication'}
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

        {/* Drug Inventory Table */}
        <Column sm={4} md={8} lg={8} style={{ marginBottom: '1.5rem' }}>
          <SearchableTable
            title={`Medication Inventory (${drugs.length})`}
            description="Catalog of available pharmaceutical supplies and active batch expiration schedules"
            rows={drugs}
            columns={columns}
            searchPlaceholder="Search drugs by name, cost, expiration..."
          />
        </Column>
      </Grid>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingDrug)}
        title="Confirm Drug Removal"
        modalHeading="Delete Medication"
        danger
        primaryButtonText="Delete Drug"
        loading={deleteLoading}
        onRequestClose={() => setDeletingDrug(null)}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to delete medication &quot;
          <strong>{deletingDrug?.name}</strong>&quot; from pharmacy stock?
        </p>
      </ConfirmModal>
    </div>
  );
};
