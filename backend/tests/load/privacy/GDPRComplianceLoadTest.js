/**
 * GDPR Compliance Load Testing Suite
 * 
 * Validates GDPR compliance requirements under load:
 * - Data access requests (Article 15)
 * - Data portability (Article 20)
 * - Right to deletion/erasure (Article 17)
 * - Consent management (Article 7)
 * - Data breach notification (Article 33/34)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// GDPR-specific metrics
const gdprDataAccessSuccess = new Rate('gdpr_data_access_success');
const gdprDeletionSuccess = new Rate('gdpr_deletion_success');
const gdprConsentManagementSuccess = new Rate('gdpr_consent_management_success');
const gdprPortabilitySuccess = new Rate('gdpr_portability_success');

const gdprDataAccessTime = new Trend('gdpr_data_access_time');
const gdprDeletionTime = new Trend('gdpr_deletion_time');
const gdprConsentUpdateTime = new Trend('gdpr_consent_update_time');
const gdprPortabilityTime = new Trend('gdpr_portability_time');

const gdprViolations = new Counter('gdpr_violations');
const gdprRequests = new Counter('gdpr_requests_total');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

/**
 * GDPR Article 15 - Right of access
 * Validates data access request processing under load
 */
export function testGDPRDataAccess() {
  const studentId = `eu_student_${Math.random().toString(36).substr(2, 9)}`;
  const requestData = {
    requesterId: studentId,
    requestType: 'GDPR_ARTICLE_15',
    jurisdiction: 'EU',
    dataTypes: [
      'personal_data',
      'educational_records',
      'ai_interactions',
      'analytics_data',
      'consent_history'
    ],
    format: 'structured_json',
    deliveryMethod: 'secure_download',
    urgency: 'standard', // 30-day deadline
    requestDate: new Date().toISOString(),
    language: 'en'
  };

  const startTime = Date.now();
  
  const response = http.post(`${API_BASE}/privacy/gdpr/data-access`, JSON.stringify(requestData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getGDPRTestToken(studentId)}`,
      'Jurisdiction': 'EU',
      'Privacy-Regulation': 'GDPR'
    }
  });

  const duration = Date.now() - startTime;
  gdprDataAccessTime.add(duration);
  gdprRequests.add(1);

  const success = check(response, {
    'GDPR data access request accepted': (r) => r.status === 202,
    'GDPR request ID provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.requestId && body.requestId.startsWith('GDPR-');
      } catch (e) {
        return false;
      }
    },
    'GDPR deadline confirmed (30 days)': (r) => {
      try {
        const body = JSON.parse(r.body);
        const deadline = new Date(body.deadline);
        const now = new Date();
        const daysDiff = (deadline - now) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30 && daysDiff >= 29; // Within GDPR timeframe
      } catch (e) {
        return false;
      }
    },
    'GDPR compliance confirmed': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.gdprCompliant === true;
      } catch (e) {
        return false;
      }
    },
    'GDPR processing time < 5s': () => duration < 5000
  });

  gdprDataAccessSuccess.add(success);

  if (!success) {
    gdprViolations.add(1);
    console.log(`GDPR data access violation for student ${studentId}`);
  }

  // Simulate checking request status
  sleep(0.5);
  const statusResponse = http.get(`${API_BASE}/privacy/gdpr/request-status/${response.body ? JSON.parse(response.body).requestId : 'unknown'}`, {
    headers: {
      'Authorization': `Bearer ${getGDPRTestToken(studentId)}`,
      'Jurisdiction': 'EU'
    }
  });

  check(statusResponse, {
    'GDPR status check successful': (r) => r.status === 200,
    'GDPR status contains progress': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status && ['processing', 'completed', 'pending'].includes(body.status);
      } catch (e) {
        return false;
      }
    }
  });

  return { studentId, success, duration, requestId: response.body ? JSON.parse(response.body).requestId : null };
}

/**
 * GDPR Article 17 - Right to erasure (right to be forgotten)
 * Validates data deletion request processing under load
 */
export function testGDPRDataDeletion() {
  const studentId = `eu_student_${Math.random().toString(36).substr(2, 9)}`;
  const deletionData = {
    requesterId: studentId,
    requestType: 'GDPR_ARTICLE_17',
    jurisdiction: 'EU',
    deletionScope: Math.random() < 0.3 ? 'partial' : 'complete',
    dataCategories: [
      'personal_identifiers',
      'educational_content',
      'ai_interaction_history',
      'behavioral_analytics'
    ],
    retentionOverrides: [
      'educational_transcript', // Cannot be deleted due to educational requirements
      'financial_records'       // Cannot be deleted due to legal requirements
    ],
    effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day
    reason: 'withdrawal_of_consent',
    requestDate: new Date().toISOString()
  };

  const startTime = Date.now();
  
  const response = http.post(`${API_BASE}/privacy/gdpr/data-deletion`, JSON.stringify(deletionData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getGDPRTestToken(studentId)}`,
      'Jurisdiction': 'EU',
      'Privacy-Regulation': 'GDPR'
    }
  });

  const duration = Date.now() - startTime;
  gdprDeletionTime.add(duration);
  gdprRequests.add(1);

  const success = check(response, {
    'GDPR deletion request accepted': (r) => r.status === 202,
    'GDPR deletion tracking provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.deletionId && body.deletionId.startsWith('DEL-GDPR-');
      } catch (e) {
        return false;
      }
    },
    'GDPR deletion timeline confirmed': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.estimatedCompletion && body.cascadeOperations;
      } catch (e) {
        return false;
      }
    },
    'GDPR retention overrides identified': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.retentionOverrides && Array.isArray(body.retentionOverrides);
      } catch (e) {
        return false;
      }
    },
    'GDPR deletion processing time < 10s': () => duration < 10000
  });

  gdprDeletionSuccess.add(success);

  if (!success) {
    gdprViolations.add(1);
    console.log(`GDPR deletion violation for student ${studentId}`);
  }

  return { studentId, success, duration };
}

/**
 * GDPR Article 7 - Conditions for consent
 * Validates consent management under load
 */
export function testGDPRConsentManagement() {
  const studentId = `eu_student_${Math.random().toString(36).substr(2, 9)}`;
  const consentData = {
    userId: studentId,
    jurisdiction: 'EU',
    consentVersion: '2.1',
    consents: {
      essential: true, // Cannot be disabled
      analytics: Math.random() < 0.7,
      marketing: Math.random() < 0.3,
      research: Math.random() < 0.5,
      third_party_sharing: Math.random() < 0.2
    },
    consentMethod: 'explicit_opt_in',
    timestamp: new Date().toISOString(),
    ipAddress: '192.168.1.100', // EU IP for testing
    withdrawalRights: true,
    dataProcessingBasis: 'consent',
    retentionPeriod: '7_years'
  };

  const startTime = Date.now();
  
  const response = http.post(`${API_BASE}/privacy/gdpr/consent-management`, JSON.stringify(consentData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getGDPRTestToken(studentId)}`,
      'Jurisdiction': 'EU',
      'Privacy-Regulation': 'GDPR'
    }
  });

  const duration = Date.now() - startTime;
  gdprConsentUpdateTime.add(duration);
  gdprRequests.add(1);

  const success = check(response, {
    'GDPR consent update accepted': (r) => r.status === 200,
    'GDPR consent confirmation provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.consentConfirmed === true && body.consentId;
      } catch (e) {
        return false;
      }
    },
    'GDPR withdrawal rights confirmed': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.withdrawalMechanism && body.withdrawalMechanism.available === true;
      } catch (e) {
        return false;
      }
    },
    'GDPR consent audit trail created': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.auditTrail && body.auditTrail.recorded === true;
      } catch (e) {
        return false;
      }
    },
    'GDPR consent processing time < 2s': () => duration < 2000
  });

  gdprConsentManagementSuccess.add(success);

  if (!success) {
    gdprViolations.add(1);
    console.log(`GDPR consent management violation for student ${studentId}`);
  }

  // Test consent withdrawal
  sleep(0.5);
  const withdrawalData = {
    userId: studentId,
    withdrawConsents: ['marketing', 'research'],
    withdrawalReason: 'changed_mind',
    effectiveDate: new Date().toISOString()
  };

  const withdrawalResponse = http.post(`${API_BASE}/privacy/gdpr/withdraw-consent`, JSON.stringify(withdrawalData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getGDPRTestToken(studentId)}`,
      'Jurisdiction': 'EU'
    }
  });

  check(withdrawalResponse, {
    'GDPR consent withdrawal processed': (r) => r.status === 200,
    'GDPR withdrawal confirmation provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.withdrawalConfirmed === true;
      } catch (e) {
        return false;
      }
    }
  });

  return { studentId, success, duration };
}

/**
 * GDPR Article 20 - Right to data portability
 * Validates data portability under load
 */
export function testGDPRDataPortability() {
  const studentId = `eu_student_${Math.random().toString(36).substr(2, 9)}`;
  const portabilityData = {
    requesterId: studentId,
    requestType: 'GDPR_ARTICLE_20',
    jurisdiction: 'EU',
    dataCategories: [
      'personal_data',
      'educational_content',
      'learning_analytics'
    ],
    outputFormat: Math.random() < 0.5 ? 'json' : 'xml',
    includeMetadata: true,
    compressionFormat: 'zip',
    deliveryMethod: 'secure_download',
    requestDate: new Date().toISOString()
  };

  const startTime = Date.now();
  
  const response = http.post(`${API_BASE}/privacy/gdpr/data-portability`, JSON.stringify(portabilityData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getGDPRTestToken(studentId)}`,
      'Jurisdiction': 'EU',
      'Privacy-Regulation': 'GDPR'
    }
  });

  const duration = Date.now() - startTime;
  gdprPortabilityTime.add(duration);
  gdprRequests.add(1);

  const success = check(response, {
    'GDPR portability request accepted': (r) => r.status === 202,
    'GDPR portability tracking provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.portabilityId && body.estimatedCompletion;
      } catch (e) {
        return false;
      }
    },
    'GDPR structured format confirmed': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.outputFormat === portabilityData.outputFormat;
      } catch (e) {
        return false;
      }
    },
    'GDPR portability processing time < 5s': () => duration < 5000
  });

  gdprPortabilitySuccess.add(success);

  if (!success) {
    gdprViolations.add(1);
    console.log(`GDPR data portability violation for student ${studentId}`);
  }

  return { studentId, success, duration };
}

/**
 * GDPR Breach Notification Testing
 * Validates breach detection and notification under load
 */
export function testGDPRBreachNotification() {
  // Simulate potential privacy breach scenarios
  const breachScenarios = [
    {
      type: 'unauthorized_access',
      severity: 'high',
      affectedUsers: Math.floor(Math.random() * 100) + 1,
      dataTypes: ['personal_data', 'educational_records'],
      containmentActions: ['access_revoked', 'system_patched']
    },
    {
      type: 'data_exfiltration',
      severity: 'critical',
      affectedUsers: Math.floor(Math.random() * 50) + 1,
      dataTypes: ['personal_data'],
      containmentActions: ['incident_response_activated']
    },
    {
      type: 'accidental_disclosure',
      severity: 'medium',
      affectedUsers: Math.floor(Math.random() * 20) + 1,
      dataTypes: ['educational_content'],
      containmentActions: ['access_corrected', 'users_notified']
    }
  ];

  const scenario = breachScenarios[Math.floor(Math.random() * breachScenarios.length)];
  
  const startTime = Date.now();
  
  const response = http.post(`${API_BASE}/privacy/gdpr/breach-notification`, JSON.stringify({
    ...scenario,
    detectionDate: new Date().toISOString(),
    jurisdiction: 'EU',
    regulation: 'GDPR',
    testMode: true
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getGDPRTestToken('system_monitor')}`,
      'Role': 'privacy_officer'
    }
  });

  const duration = Date.now() - startTime;

  const success = check(response, {
    'GDPR breach notification processed': (r) => r.status === 200,
    'GDPR breach ID assigned': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.breachId && body.breachId.startsWith('GDPR-BREACH-');
      } catch (e) {
        return false;
      }
    },
    'GDPR 72-hour timeline triggered': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.supervisoryAuthorityDeadline && body.userNotificationRequired;
      } catch (e) {
        return false;
      }
    },
    'GDPR breach processing time < 10s': () => duration < 10000
  });

  if (!success) {
    gdprViolations.add(1);
  }

  return { scenario, success, duration };
}

/**
 * Helper function to generate GDPR test tokens
 */
function getGDPRTestToken(userId) {
  return `gdpr_test_token_${userId}_${Date.now()}`;
}

// Export test scenarios for load testing framework
export const gdprTestScenarios = {
  dataAccess: testGDPRDataAccess,
  dataDeletion: testGDPRDataDeletion,
  consentManagement: testGDPRConsentManagement,
  dataPortability: testGDPRDataPortability,
  breachNotification: testGDPRBreachNotification
};

// GDPR-specific load test configuration
export const gdprOptions = {
  scenarios: {
    gdpr_data_access: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
      exec: 'gdprDataAccessTest'
    },
    gdpr_data_deletion: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 15 },
        { duration: '2m', target: 0 }
      ],
      exec: 'gdprDataDeletionTest'
    },
    gdpr_consent_management: {
      executor: 'constant-vus',
      vus: 50,
      duration: '15m',
      exec: 'gdprConsentManagementTest'
    },
    gdpr_data_portability: {
      executor: 'constant-vus',
      vus: 10,
      duration: '8m',
      exec: 'gdprDataPortabilityTest'
    }
  },
  thresholds: {
    'gdpr_data_access_success': ['rate>0.98'],
    'gdpr_deletion_success': ['rate>0.95'],
    'gdpr_consent_management_success': ['rate>0.99'],
    'gdpr_portability_success': ['rate>0.95'],
    'gdpr_data_access_time': ['p(95)<30000'], // 30 seconds
    'gdpr_deletion_time': ['p(95)<10000'],    // 10 seconds
    'gdpr_consent_update_time': ['p(95)<2000'], // 2 seconds
    'gdpr_portability_time': ['p(95)<5000'],   // 5 seconds
    'gdpr_violations': ['count<5']
  }
};

// Test execution functions for K6
export function gdprDataAccessTest() {
  testGDPRDataAccess();
  sleep(1);
}

export function gdprDataDeletionTest() {
  testGDPRDataDeletion();
  sleep(2);
}

export function gdprConsentManagementTest() {
  testGDPRConsentManagement();
  sleep(0.5);
}

export function gdprDataPortabilityTest() {
  testGDPRDataPortability();
  sleep(1.5);
}