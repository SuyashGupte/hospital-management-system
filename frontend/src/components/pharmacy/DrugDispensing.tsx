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
  Modal,
} from '@carbon/react';
import { Add, Edit, TrashCan, DocumentPdf } from '@carbon/icons-react';
import type { SelledDrug, Drug, Patient, SaleRequest, SaleResult } from '../../api/types';
import { pharmacyService } from '../../services/pharmacyService';
import { patientService } from '../../services/patientService';
import { SearchableTable, type ColumnDef } from '../common/SearchableTable';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import { isValidDateString } from '../../utils/validationUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const DrugDispensing: React.FC = () => {
  const [sales, setSales] = useState<SelledDrug[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states (Dispense / Edit Sale)
  const [isEditing, setIsEditing] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | ''>('');
  const [drugId, setDrugId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [unitPerDay, setUnitPerDay] = useState<string>('2 Tablets per day (After meals)');
  const [startTake, setStartTake] = useState<string>('');
  const [endTake, setEndTake] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Invoice Patient Modal state
  const [invoicePatientModalOpen, setInvoicePatientModalOpen] = useState(false);
  const [selectedInvoicePatientId, setSelectedInvoicePatientId] = useState<number | ''>('');

  // Reverse / Delete Sale state
  const [reversingSale, setReversingSale] = useState<SelledDrug | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);

  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [salesData, drugsData, patientsData] = await Promise.all([
        pharmacyService.getSales(),
        pharmacyService.getAllDrugs(),
        patientService.getAllPatients(),
      ]);
      setSales(salesData || []);
      setDrugs(drugsData || []);
      setPatients(patientsData || []);

      if (patientsData && patientsData.length > 0 && patientId === '') {
        setPatientId(patientsData[0].id || 1);
      }
      if (drugsData && drugsData.length > 0 && drugId === '') {
        setDrugId(drugsData[0].id || 1);
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
    setEditingSaleId(null);
    if (patients.length > 0) setPatientId(patients[0].id || 1);
    if (drugs.length > 0) setDrugId(drugs[0].id || 1);
    setQuantity(1);
    setUnitPerDay('2 Tablets per day (After meals)');
    setStartTake('');
    setEndTake('');
    setFormError(null);
  };

  const handleStartEdit = (s: SelledDrug) => {
    setIsEditing(true);
    setEditingSaleId(s.id || null);
    setPatientId(s.patient?.id || (patients[0]?.id ?? 1));
    setDrugId(s.drug?.id || (drugs[0]?.id ?? 1));
    setQuantity(s.quantity || 1);
    setUnitPerDay(s.unitPerDay || '');
    setStartTake(s.startTake || '');
    setEndTake(s.endTake || '');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientId) {
      setFormError('Please select a patient.');
      return;
    }
    if (!drugId) {
      setFormError('Please select a medication to dispense.');
      return;
    }
    if (quantity === '' || Number(quantity) <= 0) {
      setFormError('Dispense quantity must be at least 1 unit.');
      return;
    }

    const selectedDrug = drugs.find((d) => d.id === Number(drugId));
    if (selectedDrug && Number(quantity) >= selectedDrug.quantity) {
      setFormError(
        `Requested quantity (${quantity}) exceeds or equals available stock (${selectedDrug.quantity} units). Strictly less quantity required.`
      );
      return;
    }

    if (!unitPerDay.trim()) {
      setFormError('Please provide daily dosage administration instructions.');
      return;
    }
    if (!startTake.trim() || !isValidDateString(startTake)) {
      setFormError('Course start date is required in MM/dd/yyyy format (e.g. 10/24/2025).');
      return;
    }
    if (!endTake.trim() || !isValidDateString(endTake)) {
      setFormError('Course end date is required in MM/dd/yyyy format (e.g. 10/30/2025).');
      return;
    }

    const payload: SaleRequest = {
      patientId: Number(patientId),
      drugId: Number(drugId),
      quantity: Number(quantity),
      unitPerDay: unitPerDay.trim(),
      startTake: startTake.trim(),
      endTake: endTake.trim(),
    };

    setFormLoading(true);
    try {
      let res: SaleResult;
      if (isEditing && editingSaleId) {
        res = await pharmacyService.updateSale(editingSaleId, payload);
        notifySuccess('Sale Updated', res.message || 'Prescription dispensation record updated.');
      } else {
        res = await pharmacyService.sellDrug(payload);
        notifySuccess('Prescription Dispensed', `Dispensed ${quantity} unit(s) of ${selectedDrug?.name}.`);
      }

      if (res.lowStock) {
        notifyWarning('Low Stock Warning', `Remaining inventory is low (${res.remainingStock} units left).`);
      }

      resetForm();
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleReverseSale = async () => {
    if (!reversingSale?.id) return;
    setReverseLoading(true);
    try {
      await pharmacyService.reverseSale(reversingSale.id);
      notifySuccess('Prescription Sale Reversed', 'Dispensation cancelled and stock restored to inventory.');
      setReversingSale(null);
      fetchData();
    } catch (err) {
      notifyError('Failed to reverse sale', getErrorMessage(err));
    } finally {
      setReverseLoading(false);
    }
  };

  const handleDownloadInvoice = async (saleId: number) => {
    try {
      await pharmacyService.downloadInvoicePdf(saleId);
      notifySuccess('Invoice Generated', 'Downloading PDF Drug Invoice...');
      setInvoicePatientModalOpen(false);
      fetchData();
    } catch (err) {
      notifyError('Failed to generate invoice', getErrorMessage(err));
    }
  };

  const columns: ColumnDef<SelledDrug>[] = [
    {
      key: 'patient',
      header: 'Patient Name',
      sortable: true,
      render: (s) => (
        <div>
          <span style={{ fontWeight: 600 }}>
            {s.patient?.firstName} {s.patient?.fatherName} {s.patient?.familyName}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            Phone: {s.patient?.phone || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'drug',
      header: 'Medication Dispensed',
      sortable: true,
      render: (s) => (
        <div>
          <span style={{ fontWeight: 600 }}>{s.drug?.name}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {s.quantity} units &bull; ${s.drug?.cost || 0} / unit = <strong>${((s.drug?.cost || 0) * (s.quantity || 1)).toFixed(2)}</strong>
          </div>
        </div>
      ),
    },
    {
      key: 'unitPerDay',
      header: 'Dosage Instructions',
      render: (s) => s.unitPerDay,
    },
    {
      key: 'course',
      header: 'Treatment Window',
      render: (s) => (
        <span style={{ fontSize: '0.875rem' }}>
          {formatDisplayDate(s.startTake)} &rarr; {formatDisplayDate(s.endTake)}
        </span>
      ),
    },
    {
      key: 'soldDate',
      header: 'Date Dispensed',
      sortable: true,
      render: (s) => formatDisplayDate(s.soldDate),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <IconButton
            label="Generate Invoice PDF"
            kind="ghost"
            size="sm"
            onClick={() => s.id && handleDownloadInvoice(s.id)}
          >
            <DocumentPdf />
          </IconButton>
          <IconButton
            label="Edit Dispensation"
            kind="ghost"
            size="sm"
            onClick={() => handleStartEdit(s)}
          >
            <Edit />
          </IconButton>
          <IconButton
            label="Reverse / Delete Sale"
            kind="ghost"
            size="sm"
            onClick={() => setReversingSale(s)}
          >
            <TrashCan />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner description="Loading prescription sales and dispensation log..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Medication Dispensing & Invoicing</h1>
          <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
            Dispense prescription drugs with dosage schedules and issue PDF drug invoices.
          </p>
        </div>
        <Button
          kind="secondary"
          renderIcon={DocumentPdf}
          onClick={() => {
            if (patients.length > 0 && selectedInvoicePatientId === '') {
              setSelectedInvoicePatientId(patients[0].id || 1);
            }
            setInvoicePatientModalOpen(true);
          }}
        >
          Generate Patient Invoice PDF
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

      <Grid narrow fullWidth style={{ padding: 0 }}>
        {/* Form Panel (Dispense Drug) */}
        <Column sm={4} md={8} lg={4} style={{ marginBottom: '1.5rem' }}>
          <Tile style={{ padding: '1.5rem', height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {isEditing ? 'Update Dispensation' : 'Dispense Medication'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1.25rem' }}>
              {isEditing
                ? 'Update prescription details or dosage period'
                : 'Dispense pharmacy stock to a registered patient'}
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
                  id="salePatientId"
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
                  id="saleDrugId"
                  labelText="Select Medication *"
                  value={drugId}
                  onChange={(e) => setDrugId(Number(e.target.value))}
                >
                  {drugs.map((d) => (
                    <SelectItem
                      key={d.id}
                      value={d.id}
                      text={`${d.name} ($${d.cost} | ${d.quantity} in stock)`}
                    />
                  ))}
                </Select>

                <TextInput
                  id="saleQuantity"
                  type="number"
                  labelText="Dispense Quantity (Units) *"
                  placeholder="e.g. 2"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />

                <TextInput
                  id="unitPerDay"
                  labelText="Daily Dosage Instructions *"
                  placeholder="e.g. 1 Tablet every 8 hours after meals"
                  value={unitPerDay}
                  onChange={(e) => setUnitPerDay(e.target.value)}
                  required
                />

                <TextInput
                  id="startTake"
                  labelText="Course Start Date (MM/dd/yyyy) *"
                  placeholder="MM/dd/yyyy (e.g. 10/24/2025)"
                  value={startTake}
                  onChange={(e) => setStartTake(e.target.value)}
                  required
                />

                <TextInput
                  id="endTake"
                  labelText="Course End Date (MM/dd/yyyy) *"
                  placeholder="MM/dd/yyyy (e.g. 10/30/2025)"
                  value={endTake}
                  onChange={(e) => setEndTake(e.target.value)}
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
                    {formLoading ? 'Dispensing...' : isEditing ? 'Update Sale' : 'Dispense Drug'}
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

        {/* Sales Table */}
        <Column sm={4} md={8} lg={8} style={{ marginBottom: '1.5rem' }}>
          <SearchableTable
            title={`Prescription Sales History (${sales.length})`}
            description="Log of medications dispensed to patients with daily dosage schedules"
            rows={sales}
            columns={columns}
            searchPlaceholder="Search sales by patient, drug name, dosage..."
          />
        </Column>
      </Grid>

      {/* Reverse Sale Confirmation Modal */}
      <ConfirmModal
        open={Boolean(reversingSale)}
        title="Confirm Dispensation Reversal"
        modalHeading="Reverse Prescription Sale"
        danger
        primaryButtonText="Reverse Dispensation"
        loading={reverseLoading}
        onRequestClose={() => setReversingSale(null)}
        onConfirm={handleReverseSale}
      >
        <p>
          Are you sure you want to reverse the dispensation of{' '}
          <strong>{reversingSale?.quantity} units</strong> of{' '}
          <strong>{reversingSale?.drug?.name}</strong> to patient{' '}
          <strong>
            {reversingSale?.patient?.firstName} {reversingSale?.patient?.familyName}
          </strong>?
        </p>
        <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          This will cancel the sale record and restore the medication quantity back to pharmacy inventory.
        </p>
      </ConfirmModal>

      {/* PDF Invoice Modal */}
      <Modal
        open={invoicePatientModalOpen}
        modalHeading="Generate Patient Drug Invoice PDF"
        primaryButtonText="Download PDF Invoice"
        secondaryButtonText="Cancel"
        onRequestSubmit={() => {
          if (selectedInvoicePatientId) {
            handleDownloadInvoice(Number(selectedInvoicePatientId));
          }
        }}
        onRequestClose={() => setInvoicePatientModalOpen(false)}
        primaryButtonDisabled={!selectedInvoicePatientId}
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
            Select the patient to generate an official JasperReports PDF pharmacy invoice itemizing all dispensed medications, unit rates, and totals.
          </p>

          <Select
            id="invoicePatientId"
            labelText="Select Patient"
            value={selectedInvoicePatientId}
            onChange={(e) => setSelectedInvoicePatientId(Number(e.target.value))}
          >
            {patients.map((p) => (
              <SelectItem
                key={p.id}
                value={p.id}
                text={`${p.firstName} ${p.fatherName} ${p.familyName} (${p.phone})`}
              />
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
};
