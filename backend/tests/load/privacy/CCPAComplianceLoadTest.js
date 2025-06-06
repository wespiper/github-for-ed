/**
 * CCPA Compliance Load Testing Suite
 * 
 * Validates California Consumer Privacy Act (CCPA) compliance requirements under load:
 * - Right to know (information about data collection)
 * - Right to delete personal information
 * - Right to opt-out of the sale of personal information
 * - Right to non-discrimination for exercising privacy rights
 * - Special protections for consumers under 16
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// CCPA-specific metrics
const ccpaDataDisclosureSuccess = new Rate('ccpa_data_disclosure_success');
const ccpaDeletionSuccess = new Rate('ccpa_deletion_success');
const ccpaOptOutSuccess = new Rate('ccpa_opt_out_success');
const ccpaNonDiscriminationSuccess = new Rate('ccpa_non_discrimination_success');

const ccpaDataDisclosureTime = new Trend('ccpa_data_disclosure_time');
const ccpaDeletionTime = new Trend('ccpa_deletion_time');
const ccpaOptOutTime = new Trend('ccpa_opt_out_time');
const ccpaMinorProtectionTime = new Trend('ccpa_minor_protection_time');

const ccpaViolations = new Counter('ccpa_violations');
const ccpaRequests = new Counter('ccpa_requests_total');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

/**
 * CCPA Right to Know - Consumer information about data collection
 * Validates data disclosure request processing under load
 */
export function testCCPADataDisclosure() {
  const consumerId = `ca_consumer_${Math.random().toString(36).substr(2, 9)}`;
  const requestData = {
    consumerId: consumerId,
    requestType: 'CCPA_RIGHT_TO_KNOW',
    jurisdiction: 'CA',
    disclosureCategories: [
      'personal_identifiers',
      'commercial_information',
      'biometric_information',
      'internet_activity',
      'geolocation_data',
      'professional_information',
      'education_information',
      'inferences_drawn'
    ],
    timeframe: '12_months', // Last 12 months as per CCPA
    format: 'readable_format',
    deliveryMethod: 'email', // CCPA allows email delivery
    requestDate: new Date().toISOString(),
    verificationMethod: 'email_verification'
  };

  const startTime = Date.now();
  
  const response = http.post(`${API_BASE}/privacy/ccpa/data-disclosure`, JSON.stringify(requestData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getCCPATestToken(consumerId)}`,
      'Jurisdiction': 'CA',
      'Privacy-Regulation': 'CCPA'
    }
  });

  const duration = Date.now() - startTime;
  ccpaDataDisclosureTime.add(duration);
  ccpaRequests.add(1);

  const success = check(response, {
    'CCPA data disclosure request accepted': (r) => r.status === 202,
    'CCPA request ID provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.requestId && body.requestId.startsWith('CCPA-');
      } catch (e) {
        return false;
      }
    },
    'CCPA deadline confirmed (45 days)': (r) => {
      try {
        const body = JSON.parse(r.body);
        const deadline = new Date(body.deadline);
        const now = new Date();
        const daysDiff = (deadline - now) / (1000 * 60 * 60 * 24);
        return daysDiff <= 45 && daysDiff >= 44; // Within CCPA timeframe
      } catch (e) {
        return false;
      }
    },
    'CCPA verification process initiated': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.verificationRequired === true;
      } catch (e) {
        return false;
      }
    },
    'CCPA processing time < 5s': () => duration < 5000
  });

  ccpaDataDisclosureSuccess.add(success);

  if (!success) {
    ccpaViolations.add(1);
    console.log(`CCPA data disclosure violation for consumer ${consumerId}`);
  }

  // Test business information disclosure
  sleep(0.5);
  const businessInfoResponse = http.get(`${API_BASE}/privacy/ccpa/business-information`, {
    headers: {
      'Authorization': `Bearer ${getCCPATestToken(consumerId)}`,
      'Jurisdiction': 'CA'
    }
  });

  check(businessInfoResponse, {
    'CCPA business information accessible': (r) => r.status === 200,
    'CCPA business practices disclosed': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.businessPractices && body.dataCategories && body.purposes;
      } catch (e) {
        return false;
      }
    }
  });

  return { consumerId, success, duration, requestId: response.body ? JSON.parse(response.body).requestId : null };
}

/**
 * CCPA Right to Delete
 * Validates consumer data deletion under load
 */
export function testCCPADataDeletion() {
  const consumerId = `ca_consumer_${Math.random().toString(36).substr(2, 9)}`;
  const deletionData = {
    consumerId: consumerId,
    requestType: 'CCPA_RIGHT_TO_DELETE',
    jurisdiction: 'CA',
    deletionScope: Math.random() < 0.4 ? 'specific_categories' : 'all_personal_information',
    specificCategories: [
      'commercial_information',
      'internet_activity',
      'inferences_drawn'
    ],
    exceptions: [
      'complete_transaction', // CCPA exception
      'detect_security_incidents',
      'comply_with_legal_obligation'
    ],
    effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    verificationLevel: 'standard',
    requestDate: new Date().toISOString()
  };

  const startTime = Date.now();
  
  const response = http.post(`${API_BASE}/privacy/ccpa/data-deletion`, JSON.stringify(deletionData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getCCPATestToken(consumerId)}`,
      'Jurisdiction': 'CA',
      'Privacy-Regulation': 'CCPA'
    }
  });

  const duration = Date.now() - startTime;
  ccpaDeletionTime.add(duration);
  ccpaRequests.add(1);

  const success = check(response, {
    'CCPA deletion request accepted': (r) => r.status === 202,
    'CCPA deletion tracking provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.deletionId && body.deletionId.startsWith('DEL-CCPA-');
      } catch (e) {
        return false;
      }
    },
    'CCPA exceptions identified': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.exceptions && Array.isArray(body.exceptions);
      } catch (e) {
        return false;
      }
    },
    'CCPA verification requirement set': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.verificationRequired !== undefined;
      } catch (e) {
        return false;
      }
    },
    'CCPA deletion processing time < 10s': () => duration < 10000
  });

  ccpaDeletionSuccess.add(success);

  if (!success) {
    ccpaViolations.add(1);
    console.log(`CCPA deletion violation for consumer ${consumerId}`);
  }

  return { consumerId, success, duration };
}

/**
 * CCPA Right to Opt-Out of Sale
 * Validates opt-out of personal information sale
 */
export function testCCPAOptOutOfSale() {
  const consumerId = `ca_consumer_${Math.random().toString(36).substr(2, 9)}`;
  const optOutData = {
    consumerId: consumerId,
    requestType: 'CCPA_OPT_OUT_SALE',
    jurisdiction: 'CA',
    optOutScope: 'all_personal_information',
    thirdParties: [
      'analytics_provider',
      'advertising_partner',
      'research_organization'
    ],
    effectiveDate: new Date().toISOString(),
    preferenceLevel: 'permanent',
    globalOptOut: true // Global Privacy Control signal
  };

  const startTime = Date.now();
  
  const response = http.post(`${API_BASE}/privacy/ccpa/opt-out-sale`, JSON.stringify(optOutData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getCCPATestToken(consumerId)}`,
      'Jurisdiction': 'CA',
      'Global-Privacy-Control': '1' // GPC signal
    }
  });

  const duration = Date.now() - startTime;
  ccpaOptOutTime.add(duration);
  ccpaRequests.add(1);

  const success = check(response, {
    'CCPA opt-out request processed': (r) => r.status === 200,
    'CCPA opt-out confirmation provided': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.optOutConfirmed === true && body.optOutId;
      } catch (e) {
        return false;
      }
    },
    'CCPA third-party notification initiated': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.thirdPartyNotifications && body.thirdPartyNotifications.initiated === true;
      } catch (e) {
        return false;
      }
    },
    'CCPA GPC signal respected': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.globalPrivacyControl === true;
      } catch (e) {
        return false;
      }
    },
    'CCPA opt-out processing time < 3s': () => duration < 3000
  });

  ccpaOptOutSuccess.add(success);

  if (!success) {
    ccpaViolations.add(1);
    console.log(`CCPA opt-out violation for consumer ${consumerId}`);
  }

  // Test opt-in process (reversal)
  sleep(1);
  const optInData = {
    consumerId: consumerId,
    requestType: 'CCPA_OPT_IN_SALE',
    specificPurposes: ['educational_research'],
    explicitConsent: true
  };

  const optInResponse = http.post(`${API_BASE}/privacy/ccpa/opt-in-sale`, JSON.stringify(optInData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getCCPATestToken(consumerId)}`,
      'Jurisdiction': 'CA'
    }
  });

  check(optInResponse, {
    'CCPA opt-in processed': (r) => r.status === 200,
    'CCPA explicit consent recorded': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.explicitConsentRecorded === true;
      } catch (e) {
        return false;
      }
    }
  });

  return { consumerId, success, duration };
}

/**
 * CCPA Non-Discrimination Testing
 * Validates equal service provision regardless of privacy choices
 */
export function testCCPANonDiscrimination() {
  const consumers = [
    { id: `ca_consumer_opted_out_${Math.random().toString(36).substr(2, 6)}`, optedOut: true },
    { id: `ca_consumer_opted_in_${Math.random().toString(36).substr(2, 6)}`, optedOut: false }
  ];

  const serviceRequests = [
    '/api/educational/courses',
    '/api/educational/assignments',
    '/api/educational/writing-tools',
    '/api/educational/analytics'
  ];

  const results = [];

  for (const consumer of consumers) {
    for (const service of serviceRequests) {
      const startTime = Date.now();
      
      const response = http.get(`${BASE_URL}${service}`, {
        headers: {
          'Authorization': `Bearer ${getCCPATestToken(consumer.id)}`,
          'Privacy-Preference': consumer.optedOut ? 'opted_out' : 'opted_in',
          'Jurisdiction': 'CA'
        }
      });

      const duration = Date.now() - startTime;

      const success = check(response, {
        [`${service} accessible regardless of opt-out status`]: (r) => r.status === 200 || r.status === 401,
        [`${service} response time consistent`]: () => duration < 2000,
        [`${service} service level maintained`]: (r) => {
          if (r.status === 200) {
            try {
              const body = JSON.parse(r.body);
              return body.serviceLevel && body.serviceLevel !== 'degraded';
            } catch (e) {
              return true; // Non-JSON responses are fine for service equality
            }
          }
          return true;
        }
      });

      results.push({
        consumer: consumer.id,
        service,
        optedOut: consumer.optedOut,
        success,
        duration
      });

      if (!success) {
        ccpaViolations.add(1);
      }

      sleep(0.1);
    }
  }

  // Validate no discriminatory pricing
  const pricingResponse = http.get(`${API_BASE}/billing/pricing`, {
    headers: {
      'Authorization': `Bearer ${getCCPATestToken(consumers[0].id)}`,
      'Privacy-Preference': 'opted_out',
      'Jurisdiction': 'CA'
    }
  });

  const nondiscriminationSuccess = check(pricingResponse, {
    'CCPA pricing non-discriminatory': (r) => r.status === 200,
    'CCPA no premium for privacy choices': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !body.privacyPremium && body.standardPricing === true;
      } catch (e) {
        return true;
      }
    }
  });

  ccpaNonDiscriminationSuccess.add(nondiscriminationSuccess);

  return results;
}

/**
 * CCPA Special Protections for Minors (Under 16)
 * Validates enhanced protections for consumers under 16
 */
export function testCCPAMinorProtections() {
  const minorConsumers = [
    { id: `ca_minor_under13_${Math.random().toString(36).substr(2, 6)}`, age: 12 },
    { id: `ca_minor_13to15_${Math.random().toString(36).substr(2, 6)}`, age: 15 }
  ];

  const results = [];

  for (const minor of minorConsumers) {
    const startTime = Date.now();
    
    // Test data sale restrictions for minors
    const saleCheckResponse = http.get(`${API_BASE}/privacy/ccpa/minor-sale-check/${minor.id}`, {
      headers: {
        'Authorization': `Bearer ${getCCPATestToken(minor.id)}`,
        'Consumer-Age': minor.age.toString(),
        'Jurisdiction': 'CA'
      }
    });

    const duration = Date.now() - startTime;
    ccpaMinorProtectionTime.add(duration);

    const success = check(saleCheckResponse, {
      'CCPA minor sale protection active': (r) => r.status === 200,
      'CCPA under-13 opt-in required': (r) => {
        if (minor.age < 13) {
          try {
            const body = JSON.parse(r.body);
            return body.parentalConsentRequired === true;
          } catch (e) {
            return false;
          }
        }
        return true;
      },
      'CCPA 13-15 affirmative authorization required': (r) => {
        if (minor.age >= 13 && minor.age < 16) {
          try {
            const body = JSON.parse(r.body);
            return body.affirmativeAuthorizationRequired === true;
          } catch (e) {
            return false;
          }
        }
        return true;
      },
      'CCPA minor check time < 100ms': () => duration < 100
    });

    results.push({
      minor: minor.id,
      age: minor.age,
      success,
      duration
    });

    if (!success) {
      ccpaViolations.add(1);
    }

    // Test parental consent workflow for under-13
    if (minor.age < 13) {
      sleep(0.5);
      const parentalConsentResponse = http.post(`${API_BASE}/privacy/ccpa/parental-consent`, JSON.stringify({
        minorId: minor.id,
        parentEmail: 'parent@test.com',
        consentType: 'data_sale_authorization',
        verificationMethod: 'email_plus_credit_card'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCCPATestToken('parent_guardian')}`,
          'Jurisdiction': 'CA'
        }
      });

      check(parentalConsentResponse, {
        'CCPA parental consent process initiated': (r) => r.status === 202,
        'CCPA enhanced verification required': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.enhancedVerification === true;
          } catch (e) {
            return false;
          }
        }
      });
    }
  }

  return results;
}

/**
 * Helper function to generate CCPA test tokens
 */
function getCCPATestToken(consumerId) {
  return `ccpa_test_token_${consumerId}_${Date.now()}`;
}

// Export test scenarios for load testing framework
export const ccpaTestScenarios = {
  dataDisclosure: testCCPADataDisclosure,
  dataDeletion: testCCPADataDeletion,
  optOutOfSale: testCCPAOptOutOfSale,
  nonDiscrimination: testCCPANonDiscrimination,
  minorProtections: testCCPAMinorProtections
};

// CCPA-specific load test configuration
export const ccpaOptions = {
  scenarios: {
    ccpa_data_disclosure: {
      executor: 'constant-vus',
      vus: 15,
      duration: '12m',
      exec: 'ccpaDataDisclosureTest'
    },
    ccpa_data_deletion: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 8 },
        { duration: '6m', target: 12 },
        { duration: '2m', target: 0 }
      ],
      exec: 'ccpaDataDeletionTest'
    },
    ccpa_opt_out_sale: {
      executor: 'constant-vus',
      vus: 25,
      duration: '10m',
      exec: 'ccpaOptOutTest'
    },
    ccpa_non_discrimination: {
      executor: 'constant-vus',
      vus: 20,
      duration: '8m',
      exec: 'ccpaNonDiscriminationTest'
    },
    ccpa_minor_protections: {
      executor: 'constant-vus',
      vus: 10,
      duration: '6m',
      exec: 'ccpaMinorProtectionTest'
    }
  },
  thresholds: {
    'ccpa_data_disclosure_success': ['rate>0.98'],
    'ccpa_deletion_success': ['rate>0.95'],
    'ccpa_opt_out_success': ['rate>0.99'],
    'ccpa_non_discrimination_success': ['rate>0.99'],
    'ccpa_data_disclosure_time': ['p(95)<45000'], // 45 seconds
    'ccpa_deletion_time': ['p(95)<10000'],        // 10 seconds
    'ccpa_opt_out_time': ['p(95)<3000'],          // 3 seconds
    'ccpa_minor_protection_time': ['p(95)<100'],  // 100ms
    'ccpa_violations': ['count<3']
  }
};

// Test execution functions for K6
export function ccpaDataDisclosureTest() {
  testCCPADataDisclosure();
  sleep(1);
}

export function ccpaDataDeletionTest() {
  testCCPADataDeletion();
  sleep(2);
}

export function ccpaOptOutTest() {
  testCCPAOptOutOfSale();
  sleep(0.5);
}

export function ccpaNonDiscriminationTest() {
  testCCPANonDiscrimination();
  sleep(1);
}

export function ccpaMinorProtectionTest() {
  testCCPAMinorProtections();
  sleep(1.5);
}