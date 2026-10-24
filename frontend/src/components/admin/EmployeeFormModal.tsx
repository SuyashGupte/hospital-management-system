import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  TextInput,
  PasswordInput,
  Select,
  SelectItem,
  RadioButtonGroup,
  RadioButton,
  Button,
  InlineNotification,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  IconButton,
} from '@carbon/react';
import { Add, TrashCan, Upload } from '@carbon/icons-react';
import type {
  Employee,
  EmployeeRequest,
  Category,
  Qualification,
  WorkExperience,
} from '../../api/types';
import { referenceService } from '../../services/referenceService';
import { employeeService } from '../../services/employeeService';
import { isValidEmail, isValidPhone, isValidDateString } from '../../utils/validationUtils';
import { getErrorMessage } from '../../utils/errorUtils';

interface EmployeeFormModalProps {
  open: boolean;
  employeeToEdit?: Employee | null;
  onClose: () => void;
  onSuccess: (savedEmployee: Employee) => void;
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 80 }, (_, i) => String(currentYear - i));

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  open,
  employeeToEdit,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(employeeToEdit);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | string>('Male');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [type, setType] = useState<string>('Doctor');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Dynamic rows
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);

  // Reference data and submission state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (open) {
      referenceService.getCategories().then((cats) => {
        setCategories(cats || []);
        if (!isEdit && cats && cats.length > 0 && categoryId === '') {
          setCategoryId(cats[0].id || 1);
        }
      }).catch(() => {});
    }
  }, [open, isEdit, categoryId]);

  useEffect(() => {
    if (employeeToEdit && open) {
      setFirstName(employeeToEdit.firstName || '');
      setFatherName(employeeToEdit.fatherName || '');
      setFamilyName(employeeToEdit.familyName || '');
      setUserName(employeeToEdit.userName || '');
      setAddress(employeeToEdit.address || '');
      setEmail(employeeToEdit.email || '');
      setDob(employeeToEdit.dob || '');
      setPhone(employeeToEdit.phone || '');
      setGender(employeeToEdit.gender || 'Male');
      setCategoryId(employeeToEdit.category?.id || 1);
      setType(employeeToEdit.type || 'Doctor');
      setPassword('');
      setConfirmPassword('');
      setSelectedPhoto(null);
      setPhotoPreview(employeeToEdit.photo || null);
      setQualifications(employeeToEdit.qualifications ? [...employeeToEdit.qualifications] : []);
      setWorkExperiences(employeeToEdit.workExperinces ? [...employeeToEdit.workExperinces] : []);
      setFormError(null);
      setSelectedTab(0);
    } else if (open) {
      // Reset form for create
      setFirstName('');
      setFatherName('');
      setFamilyName('');
      setUserName('');
      setAddress('');
      setEmail('');
      setDob('');
      setPhone('');
      setGender('Male');
      setType('Doctor');
      setPassword('');
      setConfirmPassword('');
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setQualifications([
        { instituteName: '', qualificationName: '', degree: '', educationDate: String(currentYear) },
      ]);
      setWorkExperiences([
        { nameOfOrganization: '', position: '', startDate: String(currentYear - 2), endDate: String(currentYear) },
      ]);
      setFormError(null);
      setSelectedTab(0);
    }
  }, [employeeToEdit, open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Qualification row helpers
  const addQualification = () => {
    setQualifications((prev) => [
      ...prev,
      { instituteName: '', qualificationName: '', degree: '', educationDate: String(currentYear) },
    ]);
  };

  const removeQualification = (index: number) => {
    setQualifications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQualification = (index: number, field: keyof Qualification, val: string) => {
    setQualifications((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Work experience row helpers
  const addWorkExperience = () => {
    setWorkExperiences((prev) => [
      ...prev,
      { nameOfOrganization: '', position: '', startDate: String(currentYear - 1), endDate: String(currentYear) },
    ]);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, val: string) => {
    setWorkExperiences((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async () => {
    setFormError(null);

    // Validate required fields
    if (!firstName.trim() || !fatherName.trim() || !familyName.trim()) {
      setFormError('First Name, Father Name, and Family Name are all required.');
      setSelectedTab(0);
      return;
    }
    if (!userName.trim()) {
      setFormError('Username is required.');
      setSelectedTab(0);
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setFormError('Please enter a valid email address.');
      setSelectedTab(0);
      return;
    }
    if (!phone.trim() || !isValidPhone(phone)) {
      setFormError('Please enter a valid phone number (7 to 15 digits).');
      setSelectedTab(0);
      return;
    }
    if (!dob.trim() || !isValidDateString(dob)) {
      setFormError('Date of birth is required in MM/dd/yyyy format (e.g. 05/18/1990).');
      setSelectedTab(0);
      return;
    }
    if (!isEdit && !password) {
      setFormError('Password is required for new employees.');
      setSelectedTab(0);
      return;
    }
    if (password && password !== confirmPassword) {
      setFormError('Password and Confirm Password must match.');
      setSelectedTab(0);
      return;
    }
    if (!categoryId) {
      setFormError('Please select a Category.');
      setSelectedTab(0);
      return;
    }

    const payload: EmployeeRequest = {
      firstName: firstName.trim(),
      fatherName: fatherName.trim(),
      familyName: familyName.trim(),
      userName: userName.trim(),
      address: address.trim(),
      email: email.trim(),
      dob: dob.trim(),
      phone: phone.trim(),
      gender,
      categoryId: Number(categoryId),
      type,
      password: password ? password : (isEdit ? undefined : ''),
      qualifications: qualifications.filter((q) => q.instituteName.trim() && q.qualificationName.trim()),
      workExperiences: workExperiences.filter((w) => w.nameOfOrganization.trim() && w.position.trim()),
    };

    setLoading(true);
    try {
      let saved: Employee;
      if (isEdit && employeeToEdit?.id) {
        saved = await employeeService.updateEmployee(employeeToEdit.id, payload);
        if (selectedPhoto) {
          await employeeService.uploadPhoto(employeeToEdit.id, selectedPhoto);
        }
      } else {
        saved = await employeeService.createEmployee(payload);
        if (selectedPhoto && saved.id) {
          await employeeService.uploadPhoto(saved.id, selectedPhoto);
        }
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
      modalHeading={isEdit ? `Update Staff: ${employeeToEdit?.firstName} ${employeeToEdit?.familyName}` : 'Add New Hospital Staff Member'}
      primaryButtonText={loading ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={loading}
      onRequestSubmit={handleSubmit}
      onRequestClose={onClose}
      size="lg"
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
          <TabList aria-label="Employee Form Sections">
            <Tab>1. Basic Information</Tab>
            <Tab>2. Qualifications ({qualifications.length})</Tab>
            <Tab>3. Work Experience ({workExperiences.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Panel 1: Basic Info */}
            <TabPanel>
              <Form style={{ marginTop: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {/* Photo Preview & Upload */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem', backgroundColor: 'var(--cds-layer-01)', borderRadius: '4px' }}>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--cds-layer-02)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--cds-border-subtle)',
                      }}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', textAlign: 'center' }}>No Photo</span>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="employee-photo-upload"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--cds-button-tertiary)',
                          color: 'var(--cds-text-primary)',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <Upload size={16} /> Choose Staff Photo
                      </label>
                      <input
                        id="employee-photo-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                      />
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                        Accepted formats: PNG, JPG, JPEG (Max 50MB)
                      </p>
                    </div>
                  </div>

                  <TextInput
                    id="firstName"
                    labelText="First Name *"
                    placeholder="e.g. John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />

                  <TextInput
                    id="fatherName"
                    labelText="Father Name *"
                    placeholder="e.g. Robert"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                  />

                  <TextInput
                    id="familyName"
                    labelText="Family Name *"
                    placeholder="e.g. Smith"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                  />

                  <TextInput
                    id="userName"
                    labelText="Username *"
                    placeholder="e.g. jsmith"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />

                  <TextInput
                    id="email"
                    type="email"
                    labelText="Email Address *"
                    placeholder="e.g. jsmith@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <TextInput
                    id="phone"
                    labelText="Phone Number *"
                    placeholder="e.g. 01091234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />

                  <TextInput
                    id="dob"
                    labelText="Date of Birth (MM/dd/yyyy) *"
                    placeholder="MM/dd/yyyy (e.g. 05/18/1988)"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />

                  <TextInput
                    id="address"
                    labelText="Residential Address *"
                    placeholder="e.g. 124 Medical Plaza St."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />

                  <Select
                    id="type"
                    labelText="Job Role / Type *"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <SelectItem value="Admin" text="Admin" />
                    <SelectItem value="Doctor" text="Doctor" />
                    <SelectItem value="Nurse" text="Nurse" />
                    <SelectItem value="pharmacist" text="Pharmacist" />
                    <SelectItem value="Receptionist" text="Receptionist" />
                    <SelectItem value="Accountant" text="Accountant" />
                    <SelectItem value="Lab" text="Lab Technician" />
                    <SelectItem value="Xray" text="X-Ray Technician" />
                  </Select>

                  <Select
                    id="categoryId"
                    labelText="Category *"
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                  >
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} text={c.categoryName} />
                    ))}
                  </Select>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <RadioButtonGroup
                      legendText="Gender *"
                      name="gender"
                      valueSelected={gender}
                      onChange={(val) => setGender(String(val))}
                    >
                      <RadioButton labelText="Male" value="Male" id="gender-male" />
                      <RadioButton labelText="Female" value="Female" id="gender-female" />
                    </RadioButtonGroup>
                  </div>

                  <PasswordInput
                    id="password"
                    labelText={isEdit ? 'New Password (leave blank to keep current)' : 'Account Password *'}
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <PasswordInput
                    id="confirmPassword"
                    labelText="Confirm Password"
                    placeholder="Re-enter password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </Form>
            </TabPanel>

            {/* Panel 2: Qualifications */}
            <TabPanel>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                    Add academic degrees, institutions, and graduation years.
                  </p>
                  <Button size="sm" kind="tertiary" renderIcon={Add} onClick={addQualification}>
                    Add Qualification
                  </Button>
                </div>

                {qualifications.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--cds-text-secondary)' }}>
                    No qualifications added yet. Click &quot;Add Qualification&quot; above.
                  </p>
                ) : (
                  qualifications.map((qual, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto',
                        gap: '0.75rem',
                        alignItems: 'flex-end',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        backgroundColor: 'var(--cds-layer-01)',
                        borderRadius: '4px',
                      }}
                    >
                      <TextInput
                        id={`inst-${idx}`}
                        labelText={`Institute #${idx + 1}`}
                        placeholder="e.g. Oxford Medical School"
                        value={qual.instituteName}
                        onChange={(e) => updateQualification(idx, 'instituteName', e.target.value)}
                      />
                      <TextInput
                        id={`qualName-${idx}`}
                        labelText="Qualification"
                        placeholder="e.g. MBBS / MD"
                        value={qual.qualificationName}
                        onChange={(e) => updateQualification(idx, 'qualificationName', e.target.value)}
                      />
                      <TextInput
                        id={`degree-${idx}`}
                        labelText="Degree"
                        placeholder="e.g. Master / Bachelor"
                        value={qual.degree}
                        onChange={(e) => updateQualification(idx, 'degree', e.target.value)}
                      />
                      <Select
                        id={`year-${idx}`}
                        labelText="Year"
                        value={qual.educationDate || String(currentYear)}
                        onChange={(e) => updateQualification(idx, 'educationDate', e.target.value)}
                      >
                        {yearOptions.map((yr) => (
                          <SelectItem key={yr} value={yr} text={yr} />
                        ))}
                      </Select>
                      <IconButton
                        label="Remove row"
                        kind="ghost"
                        size="md"
                        onClick={() => removeQualification(idx)}
                      >
                        <TrashCan />
                      </IconButton>
                    </div>
                  ))
                )}
              </div>
            </TabPanel>

            {/* Panel 3: Work Experiences */}
            <TabPanel>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                    Add previous employment, hospital positions, and tenure years.
                  </p>
                  <Button size="sm" kind="tertiary" renderIcon={Add} onClick={addWorkExperience}>
                    Add Work Experience
                  </Button>
                </div>

                {workExperiences.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--cds-text-secondary)' }}>
                    No work experience entries added yet. Click &quot;Add Work Experience&quot; above.
                  </p>
                ) : (
                  workExperiences.map((exp, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
                        gap: '0.75rem',
                        alignItems: 'flex-end',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        backgroundColor: 'var(--cds-layer-01)',
                        borderRadius: '4px',
                      }}
                    >
                      <TextInput
                        id={`org-${idx}`}
                        labelText={`Organization #${idx + 1}`}
                        placeholder="e.g. City General Hospital"
                        value={exp.nameOfOrganization}
                        onChange={(e) => updateWorkExperience(idx, 'nameOfOrganization', e.target.value)}
                      />
                      <TextInput
                        id={`pos-${idx}`}
                        labelText="Position"
                        placeholder="e.g. Senior Resident"
                        value={exp.position}
                        onChange={(e) => updateWorkExperience(idx, 'position', e.target.value)}
                      />
                      <Select
                        id={`start-${idx}`}
                        labelText="Start Year"
                        value={exp.startDate || String(currentYear - 1)}
                        onChange={(e) => updateWorkExperience(idx, 'startDate', e.target.value)}
                      >
                        {yearOptions.map((yr) => (
                          <SelectItem key={yr} value={yr} text={yr} />
                        ))}
                      </Select>
                      <Select
                        id={`end-${idx}`}
                        labelText="End Year"
                        value={exp.endDate || String(currentYear)}
                        onChange={(e) => updateWorkExperience(idx, 'endDate', e.target.value)}
                      >
                        {yearOptions.map((yr) => (
                          <SelectItem key={yr} value={yr} text={yr} />
                        ))}
                      </Select>
                      <IconButton
                        label="Remove row"
                        kind="ghost"
                        size="md"
                        onClick={() => removeWorkExperience(idx)}
                      >
                        <TrashCan />
                      </IconButton>
                    </div>
                  ))
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </Modal>
  );
};
