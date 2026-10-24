import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  TextInput,
  Select,
  SelectItem,
  RadioButtonGroup,
  RadioButton,
  InlineNotification,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@carbon/react';
import type { Patient, PatientRequest, BloodGroup } from '../../api/types';
import { referenceService } from '../../services/referenceService';
import { patientService } from '../../services/patientService';
import { isValidEmail, isValidPhone, isValidDateString } from '../../utils/validationUtils';
import { getErrorMessage } from '../../utils/errorUtils';

interface PatientFormModalProps {
  open: boolean;
  patientToEdit?: Patient | null;
  onClose: () => void;
  onSuccess: (saved: Patient) => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  open,
  patientToEdit,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(patientToEdit);

  // Patient Demographic States
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | string>('Male');
  const [bloodGroupId, setBloodGroupId] = useState<number | ''>('');

  // Next of Kin States
  const [kinFullName, setKinFullName] = useState('');
  const [kinRelationship, setKinRelationship] = useState('');
  const [kinPhone, setKinPhone] = useState('');
  const [kinAddress, setKinAddress] = useState('');

  // Reference and UI states
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (open) {
      referenceService.getBloodGroups().then((bgList) => {
        setBloodGroups(bgList || []);
        if (!isEdit && bgList && bgList.length > 0 && bloodGroupId === '') {
          setBloodGroupId(bgList[0].id || 1);
        }
      }).catch(() => {});
    }
  }, [open, isEdit]);

  useEffect(() => {
    if (patientToEdit && open) {
      setFirstName(patientToEdit.firstName || '');
      setFatherName(patientToEdit.fatherName || '');
      setFamilyName(patientToEdit.familyName || '');
      setAddress(patientToEdit.address || '');
      setEmail(patientToEdit.email || '');
      setDob(patientToEdit.dob || '');
      setPhone(patientToEdit.phone || '');
      setGender(patientToEdit.gender || 'Male');
      setBloodGroupId(patientToEdit.bloodGroup?.id || 1);

      setKinFullName(patientToEdit.nextOfKin?.fullName || '');
      setKinRelationship(patientToEdit.nextOfKin?.relationship || '');
      setKinPhone(patientToEdit.nextOfKin?.phone || '');
      setKinAddress(patientToEdit.nextOfKin?.address || '');

      setFormError(null);
      setSelectedTab(0);
    } else if (open) {
      setFirstName('');
      setFatherName('');
      setFamilyName('');
      setAddress('');
      setEmail('');
      setDob('');
      setPhone('');
      setGender('Male');

      setKinFullName('');
      setKinRelationship('');
      setKinPhone('');
      setKinAddress('');

      setFormError(null);
      setSelectedTab(0);
    }
  }, [patientToEdit, open]);

  const handleSubmit = async () => {
    setFormError(null);

    if (!firstName.trim() || !fatherName.trim() || !familyName.trim()) {
      setFormError('Patient First Name, Father Name, and Family Name are required.');
      setSelectedTab(0);
      return;
    }
    if (!address.trim()) {
      setFormError('Patient Address is required.');
      setSelectedTab(0);
      return;
    }
    if (!phone.trim() || !isValidPhone(phone)) {
      setFormError('Patient Phone number is required (7 to 15 digits).');
      setSelectedTab(0);
      return;
    }
    if (email.trim() && !isValidEmail(email)) {
      setFormError('Please enter a valid email address or leave blank.');
      setSelectedTab(0);
      return;
    }
    if (!dob.trim() || !isValidDateString(dob)) {
      setFormError('Date of birth is required in MM/dd/yyyy format (e.g. 03/12/1985).');
      setSelectedTab(0);
      return;
    }
    if (!bloodGroupId) {
      setFormError('Please select a Blood Group.');
      setSelectedTab(0);
      return;
    }

    // Validate Next of Kin
    if (!kinFullName.trim()) {
      setFormError('Next of Kin Full Name is required.');
      setSelectedTab(1);
      return;
    }
    if (!kinRelationship.trim()) {
      setFormError('Next of Kin Relationship (e.g. Spouse, Parent, Sibling) is required.');
      setSelectedTab(1);
      return;
    }
    if (!kinPhone.trim() || !isValidPhone(kinPhone)) {
      setFormError('Next of Kin Phone number is required (7 to 15 digits).');
      setSelectedTab(1);
      return;
    }

    const payload: PatientRequest = {
      firstName: firstName.trim(),
      fatherName: fatherName.trim(),
      familyName: familyName.trim(),
      address: address.trim(),
      email: email.trim() || undefined,
      dob: dob.trim(),
      phone: phone.trim(),
      gender,
      bloodGroupId: Number(bloodGroupId),
      nextOfKin: {
        fullName: kinFullName.trim(),
        relationship: kinRelationship.trim(),
        phone: kinPhone.trim(),
        address: kinAddress.trim() || undefined,
      },
    };

    setLoading(true);
    try {
      let saved: Patient;
      if (isEdit && patientToEdit?.id) {
        saved = await patientService.updatePatient(patientToEdit.id, payload);
      } else {
        saved = await patientService.createPatient(payload);
      }
      onSuccess(saved);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading={isEdit ? `Update Patient: ${patientToEdit?.firstName} ${patientToEdit?.familyName}` : 'Register New Inpatient / Outpatient'}
      primaryButtonText={loading ? 'Saving...' : isEdit ? 'Update Patient' : 'Register Patient'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={loading}
      onRequestSubmit={handleSubmit}
      onRequestClose={onClose}
      size="md"
    >
      <div style={{ padding: '0.5rem 0' }}>
        {formError && (
          <InlineNotification
            kind="error"
            title="Validation Error"
            subtitle={formError}
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Tabs selectedIndex={selectedTab} onChange={({ selectedIndex }) => setSelectedTab(selectedIndex)}>
          <TabList aria-label="Patient Registration Tabs">
            <Tab>1. Patient Demographics</Tab>
            <Tab>2. Emergency Next of Kin</Tab>
          </TabList>

          <TabPanels>
            {/* Panel 1: Patient Demographics */}
            <TabPanel>
              <Form style={{ marginTop: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <TextInput
                    id="patientFirstName"
                    labelText="First Name *"
                    placeholder="e.g. John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />

                  <TextInput
                    id="patientFatherName"
                    labelText="Father Name *"
                    placeholder="e.g. Robert"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                  />

                  <TextInput
                    id="patientFamilyName"
                    labelText="Family Name *"
                    placeholder="e.g. Smith"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                  />

                  <TextInput
                    id="patientPhone"
                    labelText="Contact Phone *"
                    placeholder="e.g. 01091234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />

                  <TextInput
                    id="patientEmail"
                    type="email"
                    labelText="Email Address (Optional)"
                    placeholder="e.g. john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <TextInput
                    id="patientDob"
                    labelText="Date of Birth (MM/dd/yyyy) *"
                    placeholder="MM/dd/yyyy (e.g. 05/18/1988)"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />

                  <Select
                    id="patientBloodGroup"
                    labelText="Blood Type *"
                    value={bloodGroupId}
                    onChange={(e) => setBloodGroupId(Number(e.target.value))}
                  >
                    {bloodGroups.map((bg) => (
                      <SelectItem key={bg.id} value={bg.id} text={bg.bloodGroup} />
                    ))}
                  </Select>

                  <TextInput
                    id="patientAddress"
                    labelText="Residential Address *"
                    placeholder="e.g. 45 Downtown Blvd, Apt 3B"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />

                  <div style={{ gridColumn: '1 / -1' }}>
                    <RadioButtonGroup
                      legendText="Gender *"
                      name="patientGender"
                      valueSelected={gender}
                      onChange={(val) => setGender(String(val))}
                    >
                      <RadioButton labelText="Male" value="Male" id="pat-gender-male" />
                      <RadioButton labelText="Female" value="Female" id="pat-gender-female" />
                    </RadioButtonGroup>
                  </div>
                </div>
              </Form>
            </TabPanel>

            {/* Panel 2: Next of Kin */}
            <TabPanel>
              <Form style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
                  Provide emergency contact and next-of-kin information for hospital admission notifications.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <TextInput
                    id="kinFullName"
                    labelText="Next of Kin Full Name *"
                    placeholder="e.g. Mary Smith"
                    value={kinFullName}
                    onChange={(e) => setKinFullName(e.target.value)}
                    required
                  />

                  <TextInput
                    id="kinRelationship"
                    labelText="Relationship to Patient *"
                    placeholder="e.g. Spouse / Mother / Brother"
                    value={kinRelationship}
                    onChange={(e) => setKinRelationship(e.target.value)}
                    required
                  />

                  <TextInput
                    id="kinPhone"
                    labelText="Next of Kin Phone Number *"
                    placeholder="e.g. 01099887766"
                    value={kinPhone}
                    onChange={(e) => setKinPhone(e.target.value)}
                    required
                  />

                  <TextInput
                    id="kinAddress"
                    labelText="Next of Kin Address (Optional)"
                    placeholder="e.g. Same as patient"
                    value={kinAddress}
                    onChange={(e) => setKinAddress(e.target.value)}
                  />
                </div>
              </Form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </Modal>
  );
};
