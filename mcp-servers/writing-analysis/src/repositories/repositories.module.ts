import { Module } from '@nestjs/common';
import { WritingSessionRepository } from './writing-session.repository';
import { ReflectionRepository } from './reflection.repository';
import { AuditRepository } from './audit.repository';
import { StudentPreferenceRepository } from './student-preference.repository';

@Module({
  providers: [
    WritingSessionRepository,
    ReflectionRepository,
    AuditRepository,
    StudentPreferenceRepository,
  ],
  exports: [
    WritingSessionRepository,
    ReflectionRepository,
    AuditRepository,
    StudentPreferenceRepository,
  ],
})
export class RepositoriesModule {}