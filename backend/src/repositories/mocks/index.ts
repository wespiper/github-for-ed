/**
 * Privacy-Enhanced Mock Repositories
 * Export all mock repositories with privacy awareness for testing
 */

export { MockStudentRepositoryPrivacy } from './MockStudentRepositoryPrivacy';
export { MockAuditRepository } from '../AuditRepository';

// Re-export original mocks for backward compatibility
export { MockStudentRepository } from '../mock/MockStudentRepository';
export { MockAssignmentRepository } from '../mock/MockAssignmentRepository';
export { MockAIInteractionRepository } from '../mock/MockAIInteractionRepository';