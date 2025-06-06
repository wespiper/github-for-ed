/**
 * FERPA Compliance Load Testing Suite
 * 
 * Validates Family Educational Rights and Privacy Act (FERPA) compliance under load:
 * - Educational records access control
 * - Parental rights for students under 18
 * - Student rights for students 18 and over
 * - Legitimate educational interest validation
 * - Directory information handling
 * - Third-party disclosure restrictions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// FERPA-specific metrics
const ferpaAccessControlSuccess = new Rate('ferpa_access_control_success');
const ferpaParentalRightsSuccess = new Rate('ferpa_parental_rights_success');
const ferpaStudentRightsSuccess = new Rate('ferpa_student_rights_success');
const ferpaDisclosureAuthSuccess = new Rate('ferpa_disclosure_authorization_success');

const ferpaAccessControlTime = new Trend('ferpa_access_control_time');
const ferpaParentalAccessTime = new Trend('ferpa_parental_access_time');
const ferpaStudentAccessTime = new Trend('ferpa_student_access_time');
const ferpaDisclosureTime = new Trend('ferpa_disclosure_time');
const ferpaConsentTime = new Trend('ferpa_consent_time');

const ferpaViolations = new Counter('ferpa_violations');
const ferpaRequests = new Counter('ferpa_requests_total');
const ferpaDisclosureAttempts = new Counter('ferpa_disclosure_attempts');
const ferpaUnauthorizedAccess = new Counter('ferpa_unauthorized_access');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

/**
 * FERPA Educational Records Access Control
 * Validates proper access control for educational records
 */
export function testFERPAAccessControl() {
  const student = generateFERPAStudent();
  const educator = generateFERPAEducator();
  const unauthorizedUser = generateUnauthorizedUser();

  const accessScenarios = [
    {
      user: educator,
      userType: 'educator',
      expectedAccess: true,
      purpose: 'legitimate_educational_interest'
    },
    {
      user: student,
      userType: 'student',
      expectedAccess: student.age >= 18,
      purpose: 'self_access'
    },
    {
      user: unauthorizedUser,
      userType: 'unauthorized',
      expectedAccess: false,
      purpose: 'none'
    }
  ];

  const results = [];

  for (const scenario of accessScenarios) {
    const startTime = Date.now();
    
    const response = http.get(`${API_BASE}/ferpa/educational-records/${student.id}`, {
      headers: {
        'Authorization': `Bearer ${getFERPATestToken(scenario.user.id, scenario.userType)}`,
        'Role': scenario.userType,
        'Educational-Purpose': scenario.purpose,
        'Institution': 'test-university'
      }
    });

    const duration = Date.now() - startTime;
    ferpaAccessControlTime.add(duration);
    ferpaRequests.add(1);

    const expectedStatus = scenario.expectedAccess ? 200 : 403;
    
    const success = check(response, {
      [`FERPA ${scenario.userType} access control correct`]: (r) => r.status === expectedStatus,
      [`FERPA ${scenario.userType} response time < 200ms`]: () => duration < 200,
      [`FERPA ${scenario.userType} educational interest validated`]: (r) => {
        if (r.status === 200) {
          try {
            const body = JSON.parse(r.body);
            return body.educationalInterestValidated === true;
          } catch (e) {
            return false;
          }
        }
        return true; // Not applicable for denied access
      },
      [`FERPA ${scenario.userType} audit log created`]: (r) => {
        try {
          const auditHeader = r.headers['X-FERPA-Audit-ID'];
          return auditHeader && auditHeader.startsWith('FERPA-');
        } catch (e) {
          return false;
        }
      }
    });

    ferpaAccessControlSuccess.add(success);

    if (!success || (r.status === 403 && scenario.expectedAccess)) {
      ferpaViolations.add(1);
      if (r.status === 200 && !scenario.expectedAccess) {
        ferpaUnauthorizedAccess.add(1);
      }
    }

    results.push({
      scenario: scenario.userType,
      student: student.id,
      success,
      duration,
      expectedAccess: scenario.expectedAccess,
      actualAccess: response.status === 200
    });

    sleep(0.1);
  }

  return results;
}

/**
 * FERPA Parental Rights (Students Under 18)
 * Validates parental access to educational records
 */
export function testFERPAParentalRights() {
  const minorStudent = generateFERPAStudent(16); // Under 18
  const parent = generateFERPAParent(minorStudent.id);
  
  const startTime = Date.now();

  // Test parental access to educational records
  const recordAccessResponse = http.get(`${API_BASE}/ferpa/parental-access/${minorStudent.id}`, {
    headers: {
      'Authorization': `Bearer ${getFERPATestToken(parent.id, 'parent')}`,
      'Role': 'parent',
      'Relationship': 'custodial_parent',
      'Student-ID': minorStudent.id,
      'Verification-Status': 'verified'
    }
  });

  const parentalAccessDuration = Date.now() - startTime;
  ferpaParentalAccessTime.add(parentalAccessDuration);
  ferpaRequests.add(1);

  const parentalAccessSuccess = check(recordAccessResponse, {
    'FERPA parental access granted': (r) => r.status === 200,
    'FERPA parental verification confirmed': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.parentalVerification === 'confirmed';
      } catch (e) {
        return false;
      }
    },
    'FERPA minor student records provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.educationalRecords && body.studentAge < 18;
      } catch (e) {
        return false;
      }
    },
    'FERPA parental access time < 500ms': () => parentalAccessDuration < 500
  });

  // Test parental consent for disclosure
  sleep(0.5);
  const consentStart = Date.now();
  
  const disclosureConsentResponse = http.post(`${API_BASE}/ferpa/parental-consent`, JSON.stringify({
    studentId: minorStudent.id,
    parentId: parent.id,
    disclosurePurpose: 'college_application',
    recipientOrganization: 'State University',
    dataTypes: ['transcripts', 'disciplinary_records'],
    consentDuration: '1_year',
    consentDate: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getFERPATestToken(parent.id, 'parent')}`,
      'Role': 'parent'
    }
  });

  const consentDuration = Date.now() - consentStart;
  ferpaConsentTime.add(consentDuration);

  const consentSuccess = check(disclosureConsentResponse, {
    'FERPA parental consent recorded': (r) => r.status === 201,
    'FERPA consent tracking provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.consentId && body.consentId.startsWith('FERPA-CONSENT-');
      } catch (e) {
        return false;
      }
    },
    'FERPA consent audit created': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.auditTrail === true;
      } catch (e) {
        return false;
      }
    },
    'FERPA consent time < 300ms': () => consentDuration < 300
  });

  const overallSuccess = parentalAccessSuccess && consentSuccess;
  ferpaParentalRightsSuccess.add(overallSuccess);

  if (!overallSuccess) {
    ferpaViolations.add(1);
  }

  return {
    student: minorStudent.id,
    parent: parent.id,
    parentalAccess: parentalAccessSuccess,
    consentGranting: consentSuccess,
    overallSuccess,
    duration: parentalAccessDuration + consentDuration
  };
}

/**
 * FERPA Student Rights (18 and Over)
 * Validates student access to own educational records
 */
export function testFERPAStudentRights() {
  const adultStudent = generateFERPAStudent(20); // 18 or over
  
  const startTime = Date.now();

  // Test student access to own records
  const recordAccessResponse = http.get(`${API_BASE}/ferpa/student-records/${adultStudent.id}`, {
    headers: {
      'Authorization': `Bearer ${getFERPATestToken(adultStudent.id, 'student')}`,
      'Role': 'student',
      'Self-Access': 'true',
      'Age-Verified': 'true'
    }
  });

  const studentAccessDuration = Date.now() - startTime;
  ferpaStudentAccessTime.add(studentAccessDuration);
  ferpaRequests.add(1);

  const studentAccessSuccess = check(recordAccessResponse, {
    'FERPA student self-access granted': (r) => r.status === 200,
    'FERPA complete records provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.educationalRecords && body.completeAccess === true;
      } catch (e) {
        return false;
      }
    },
    'FERPA directory information included': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.directoryInformation !== undefined;
      } catch (e) {
        return false;
      }
    },
    'FERPA student access time < 400ms': () => studentAccessDuration < 400
  });

  // Test student consent for disclosure
  sleep(0.5);
  const consentStart = Date.now();
  
  const studentConsentResponse = http.post(`${API_BASE}/ferpa/student-consent`, JSON.stringify({
    studentId: adultStudent.id,
    disclosurePurpose: 'employment_verification',
    recipientOrganization: 'Tech Company Inc',
    dataTypes: ['enrollment_status', 'degree_completion'],
    consentScope: 'specific_disclosure',
    consentDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() // 6 months
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getFERPATestToken(adultStudent.id, 'student')}`,
      'Role': 'student'
    }
  });

  const consentDuration = Date.now() - consentStart;
  ferpaConsentTime.add(consentDuration);

  const consentSuccess = check(studentConsentResponse, {
    'FERPA student consent recorded': (r) => r.status === 201,
    'FERPA consent specificity maintained': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.consentScope === 'specific_disclosure';
      } catch (e) {
        return false;
      }
    },
    'FERPA consent expiration set': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.expirationDate !== undefined;
      } catch (e) {
        return false;
      }
    },
    'FERPA student consent time < 250ms': () => consentDuration < 250
  });

  const overallSuccess = studentAccessSuccess && consentSuccess;
  ferpaStudentRightsSuccess.add(overallSuccess);

  if (!overallSuccess) {
    ferpaViolations.add(1);
  }

  return {
    student: adultStudent.id,
    selfAccess: studentAccessSuccess,
    consentGranting: consentSuccess,
    overallSuccess,
    duration: studentAccessDuration + consentDuration
  };
}

/**
 * FERPA Third-Party Disclosure Authorization
 * Validates proper authorization for third-party disclosures
 */
export function testFERPADisclosureAuthorization() {
  const student = generateFERPAStudent();
  const thirdPartyOrganizations = [
    { name: 'State University', type: 'educational_institution', requires_consent: false },
    { name: 'Department of Education', type: 'government_agency', requires_consent: false },
    { name: 'Private Employer', type: 'commercial_entity', requires_consent: true },
    { name: 'Research Organization', type: 'research_entity', requires_consent: true }
  ];

  const results = [];

  for (const org of thirdPartyOrganizations) {
    const startTime = Date.now();
    
    const disclosureRequest = {
      studentId: student.id,
      requestingOrganization: org.name,
      organizationType: org.type,
      disclosurePurpose: getDisclosurePurpose(org.type),
      dataRequested: ['enrollment_status', 'academic_standing'],
      urgency: Math.random() < 0.1 ? 'emergency' : 'standard',
      legitimateEducationalInterest: org.type === 'educational_institution'
    };

    const response = http.post(`${API_BASE}/ferpa/disclosure-request`, JSON.stringify(disclosureRequest), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getFERPATestToken(org.name.replace(/\s+/g, '_'), 'third_party')}`,
        'Organization-Type': org.type,
        'Requesting-Party': org.name
      }
    });

    const duration = Date.now() - startTime;
    ferpaDisclosureTime.add(duration);
    ferpaDisclosureAttempts.add(1);

    const expectedStatus = org.requires_consent ? 202 : 200; // 202 for pending consent, 200 for authorized
    
    const success = check(response, {
      [`FERPA ${org.type} disclosure properly handled`]: (r) => r.status === expectedStatus || r.status === 403,
      [`FERPA ${org.type} authorization checked`]: (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.authorizationChecked === true;
        } catch (e) {
          return false;
        }
      },
      [`FERPA ${org.type} consent requirement correct`]: (r) => {
        if (org.requires_consent) {
          try {
            const body = JSON.parse(r.body);
            return body.consentRequired === true || r.status === 403;
          } catch (e) {
            return r.status === 403;
          }
        } else {
          return r.status === 200 || r.status === 403; // May be denied for other reasons
        }
      },
      [`FERPA ${org.type} processing time < 1s`]: () => duration < 1000
    });

    ferpaDisclosureAuthSuccess.add(success);

    if (!success) {
      ferpaViolations.add(1);
    }

    results.push({
      organization: org.name,
      type: org.type,
      requiresConsent: org.requires_consent,
      success,
      duration,
      status: response.status
    });

    sleep(0.2);
  }

  return results;
}

/**
 * FERPA Directory Information Handling
 * Validates proper handling of directory information
 */
export function testFERPADirectoryInformation() {
  const students = [
    { ...generateFERPAStudent(), directoryOptOut: false },
    { ...generateFERPAStudent(), directoryOptOut: true }
  ];

  const directoryFields = [
    'name',
    'enrollment_status',
    'major_field_of_study',
    'dates_of_attendance',
    'degrees_awarded'
  ];

  const results = [];

  for (const student of students) {
    const startTime = Date.now();
    
    const response = http.get(`${API_BASE}/ferpa/directory-information/${student.id}`, {
      headers: {
        'Authorization': `Bearer ${getFERPATestToken('public_requester', 'public')}`,
        'Request-Type': 'directory_information',
        'Public-Access': 'true'
      }
    });

    const duration = Date.now() - startTime;

    const success = check(response, {
      'FERPA directory information access controlled': (r) => {
        if (student.directoryOptOut) {
          return r.status === 403 || r.status === 404;
        } else {
          return r.status === 200;
        }
      },
      'FERPA directory fields limited': (r) => {
        if (r.status === 200) {
          try {
            const body = JSON.parse(r.body);
            const returnedFields = Object.keys(body.data || {});
            return returnedFields.every(field => directoryFields.includes(field));
          } catch (e) {
            return false;
          }
        }
        return true;
      },
      'FERPA opt-out status respected': (r) => {
        if (student.directoryOptOut) {
          return r.status !== 200;
        } else {
          return r.status === 200;
        }
      },
      'FERPA directory access time < 150ms': () => duration < 150
    });

    results.push({
      student: student.id,
      optedOut: student.directoryOptOut,
      success,
      duration,
      accessible: response.status === 200
    });

    if (!success) {
      ferpaViolations.add(1);
    }

    sleep(0.1);
  }

  return results;
}

// Helper functions
function generateFERPAStudent(age = null) {
  const studentAge = age || (Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 16 : Math.floor(Math.random() * 6) + 18);
  return {
    id: `ferpa_student_${Math.random().toString(36).substr(2, 9)}`,
    age: studentAge,
    enrollmentStatus: 'enrolled',
    directoryOptOut: Math.random() < 0.2,
    institution: 'test-university'
  };
}

function generateFERPAEducator() {
  return {
    id: `ferpa_educator_${Math.random().toString(36).substr(2, 9)}`,
    role: 'faculty',
    department: 'Computer Science',
    legitimateEducationalInterest: true,
    institution: 'test-university'
  };
}

function generateFERPAParent(studentId) {
  return {
    id: `ferpa_parent_${Math.random().toString(36).substr(2, 9)}`,
    studentId: studentId,
    relationship: 'custodial_parent',
    verified: true
  };
}

function generateUnauthorizedUser() {
  return {
    id: `unauthorized_${Math.random().toString(36).substr(2, 9)}`,
    role: 'external',
    institution: 'other-organization'
  };
}

function getDisclosurePurpose(orgType) {
  const purposes = {
    'educational_institution': 'student_transfer',
    'government_agency': 'compliance_audit',
    'commercial_entity': 'employment_verification',
    'research_entity': 'educational_research'
  };
  return purposes[orgType] || 'general_inquiry';
}

function getFERPATestToken(userId, userType) {
  return `ferpa_test_token_${userType}_${userId}_${Date.now()}`;
}

// Export test scenarios for load testing framework
export const ferpaTestScenarios = {
  accessControl: testFERPAAccessControl,
  parentalRights: testFERPAParentalRights,
  studentRights: testFERPAStudentRights,
  disclosureAuthorization: testFERPADisclosureAuthorization,
  directoryInformation: testFERPADirectoryInformation
};

// FERPA-specific load test configuration
export const ferpaOptions = {
  scenarios: {
    ferpa_access_control: {
      executor: 'constant-vus',
      vus: 30,
      duration: '10m',
      exec: 'ferpaAccessControlTest'
    },
    ferpa_parental_rights: {
      executor: 'constant-vus',
      vus: 15,
      duration: '8m',
      exec: 'ferpaParentalRightsTest'
    },
    ferpa_student_rights: {
      executor: 'constant-vus',
      vus: 25,
      duration: '12m',
      exec: 'ferpaStudentRightsTest'
    },
    ferpa_disclosure_auth: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '6m', target: 20 },
        { duration: '2m', target: 0 }
      ],
      exec: 'ferpaDisclosureAuthTest'
    },
    ferpa_directory_info: {
      executor: 'constant-vus',
      vus: 40,
      duration: '6m',
      exec: 'ferpaDirectoryInfoTest'
    }
  },
  thresholds: {
    'ferpa_access_control_success': ['rate>0.99'],
    'ferpa_parental_rights_success': ['rate>0.98'],
    'ferpa_student_rights_success': ['rate>0.99'],
    'ferpa_disclosure_authorization_success': ['rate>0.97'],
    'ferpa_access_control_time': ['p(95)<200'],       // 200ms
    'ferpa_parental_access_time': ['p(95)<500'],      // 500ms
    'ferpa_student_access_time': ['p(95)<400'],       // 400ms
    'ferpa_disclosure_time': ['p(95)<1000'],          // 1 second
    'ferpa_consent_time': ['p(95)<300'],              // 300ms
    'ferpa_violations': ['count<2'],
    'ferpa_unauthorized_access': ['count<1']
  }
};

// Test execution functions for K6
export function ferpaAccessControlTest() {
  testFERPAAccessControl();
  sleep(1);
}

export function ferpaParentalRightsTest() {
  testFERPAParentalRights();
  sleep(1.5);
}

export function ferpaStudentRightsTest() {
  testFERPAStudentRights();
  sleep(1);
}

export function ferpaDisclosureAuthTest() {
  testFERPADisclosureAuthorization();
  sleep(2);
}

export function ferpaDirectoryInfoTest() {
  testFERPADirectoryInformation();
  sleep(0.5);
}