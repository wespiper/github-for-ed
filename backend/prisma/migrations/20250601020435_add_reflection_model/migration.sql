-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "ai_boundary_settings" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "ai_interaction_logs" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "assistance_type" TEXT NOT NULL,
    "questions_generated" INTEGER,
    "educationally_sound" BOOLEAN NOT NULL,
    "writing_stage" TEXT NOT NULL,
    "question_text" TEXT,
    "response_id" TEXT NOT NULL,
    "reflection_completed" BOOLEAN NOT NULL DEFAULT false,
    "reflection_quality_score" INTEGER,
    "reflection_submitted_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflection_analyses" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "ai_interaction_id" TEXT NOT NULL,
    "reflection_text" TEXT NOT NULL,
    "depth_score" INTEGER NOT NULL,
    "reasoning_chains" INTEGER NOT NULL,
    "abstraction_level" INTEGER NOT NULL,
    "evidence_of_thinking" JSONB NOT NULL DEFAULT '[]',
    "self_awareness_score" INTEGER NOT NULL,
    "recognizes_gaps" BOOLEAN NOT NULL DEFAULT false,
    "questions_assumptions" BOOLEAN NOT NULL DEFAULT false,
    "identifies_learning_process" BOOLEAN NOT NULL DEFAULT false,
    "articulates_struggle" BOOLEAN NOT NULL DEFAULT false,
    "critical_thinking_score" INTEGER NOT NULL,
    "challenges_ai_prompts" BOOLEAN NOT NULL DEFAULT false,
    "offers_alternatives" BOOLEAN NOT NULL DEFAULT false,
    "evaluates_perspectives" BOOLEAN NOT NULL DEFAULT false,
    "synthesizes_ideas" BOOLEAN NOT NULL DEFAULT false,
    "growth_mindset_score" INTEGER NOT NULL,
    "focus_on_learning" BOOLEAN NOT NULL DEFAULT false,
    "embraces_challenge" BOOLEAN NOT NULL DEFAULT false,
    "seeks_improvement" BOOLEAN NOT NULL DEFAULT false,
    "overall_quality_score" INTEGER NOT NULL,
    "authenticity_score" INTEGER NOT NULL,
    "progressive_access_level" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reflection_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "document_id" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "stage" TEXT,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "question_complexity" TEXT NOT NULL DEFAULT 'mixed',
    "preferred_learning_style" TEXT NOT NULL DEFAULT 'mixed',
    "average_reflection_depth" INTEGER NOT NULL DEFAULT 0,
    "best_responds_to" JSONB NOT NULL DEFAULT '[]',
    "struggles_with" JSONB NOT NULL DEFAULT '[]',
    "evidence_analysis" INTEGER NOT NULL DEFAULT 50,
    "perspective_taking" INTEGER NOT NULL DEFAULT 50,
    "logical_reasoning" INTEGER NOT NULL DEFAULT 50,
    "creative_thinking" INTEGER NOT NULL DEFAULT 50,
    "organizational_skills" INTEGER NOT NULL DEFAULT 50,
    "metacognition" INTEGER NOT NULL DEFAULT 50,
    "current_cognitive_load" TEXT NOT NULL DEFAULT 'optimal',
    "emotional_state" TEXT NOT NULL DEFAULT 'neutral',
    "current_focus" TEXT,
    "recent_breakthrough" BOOLEAN NOT NULL DEFAULT false,
    "struggling_duration" INTEGER NOT NULL DEFAULT 0,
    "last_successful_interaction" TIMESTAMP(3),
    "last_activity_time" TIMESTAMP(3),
    "ai_request_frequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "independent_work_streak" INTEGER NOT NULL DEFAULT 0,
    "quality_without_ai" INTEGER NOT NULL DEFAULT 0,
    "independence_trend" TEXT NOT NULL DEFAULT 'stable',
    "last_milestone" TEXT,
    "best_time_of_day" TEXT NOT NULL DEFAULT 'afternoon',
    "average_session_length" INTEGER NOT NULL DEFAULT 30,
    "break_frequency" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "productivity_pattern" TEXT NOT NULL DEFAULT 'steady',
    "session_metrics" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_recommendations" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "recommendation_type" TEXT NOT NULL,
    "recommendation" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "implemented_at" TIMESTAMP(3),
    "implemented_by" TEXT,
    "educator_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boundary_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_proposals" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "specific_change" TEXT NOT NULL,
    "affected_students" TEXT[],
    "expected_outcome" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "educator_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boundary_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_adjustment_logs" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "proposal_id" TEXT,
    "previous_value" JSONB NOT NULL,
    "new_value" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "implemented_by" TEXT NOT NULL,
    "impact_metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boundary_adjustment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_interaction_logs_student_id_created_at_idx" ON "ai_interaction_logs"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_assignment_id_idx" ON "ai_interaction_logs"("assignment_id");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_assistance_type_idx" ON "ai_interaction_logs"("assistance_type");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_educationally_sound_idx" ON "ai_interaction_logs"("educationally_sound");

-- CreateIndex
CREATE INDEX "reflection_analyses_student_id_idx" ON "reflection_analyses"("student_id");

-- CreateIndex
CREATE INDEX "reflection_analyses_assignment_id_idx" ON "reflection_analyses"("assignment_id");

-- CreateIndex
CREATE INDEX "reflection_analyses_created_at_idx" ON "reflection_analyses"("created_at");

-- CreateIndex
CREATE INDEX "reflection_analyses_overall_quality_score_idx" ON "reflection_analyses"("overall_quality_score");

-- CreateIndex
CREATE INDEX "reflection_analyses_progressive_access_level_idx" ON "reflection_analyses"("progressive_access_level");

-- CreateIndex
CREATE INDEX "reflections_user_id_idx" ON "reflections"("user_id");

-- CreateIndex
CREATE INDEX "reflections_assignment_id_idx" ON "reflections"("assignment_id");

-- CreateIndex
CREATE INDEX "reflections_type_idx" ON "reflections"("type");

-- CreateIndex
CREATE INDEX "reflections_created_at_idx" ON "reflections"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_student_id_key" ON "student_profiles"("student_id");

-- CreateIndex
CREATE INDEX "student_profiles_current_cognitive_load_idx" ON "student_profiles"("current_cognitive_load");

-- CreateIndex
CREATE INDEX "student_profiles_independence_trend_idx" ON "student_profiles"("independence_trend");

-- CreateIndex
CREATE INDEX "student_profiles_emotional_state_idx" ON "student_profiles"("emotional_state");

-- CreateIndex
CREATE INDEX "boundary_recommendations_assignment_id_idx" ON "boundary_recommendations"("assignment_id");

-- CreateIndex
CREATE INDEX "boundary_recommendations_status_idx" ON "boundary_recommendations"("status");

-- CreateIndex
CREATE INDEX "boundary_proposals_assignment_id_idx" ON "boundary_proposals"("assignment_id");

-- CreateIndex
CREATE INDEX "boundary_proposals_status_idx" ON "boundary_proposals"("status");

-- CreateIndex
CREATE INDEX "boundary_proposals_type_idx" ON "boundary_proposals"("type");

-- CreateIndex
CREATE INDEX "boundary_adjustment_logs_assignment_id_idx" ON "boundary_adjustment_logs"("assignment_id");

-- CreateIndex
CREATE INDEX "boundary_adjustment_logs_proposal_id_idx" ON "boundary_adjustment_logs"("proposal_id");

-- AddForeignKey
ALTER TABLE "ai_interaction_logs" ADD CONSTRAINT "ai_interaction_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interaction_logs" ADD CONSTRAINT "ai_interaction_logs_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_analyses" ADD CONSTRAINT "reflection_analyses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_analyses" ADD CONSTRAINT "reflection_analyses_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_analyses" ADD CONSTRAINT "reflection_analyses_ai_interaction_id_fkey" FOREIGN KEY ("ai_interaction_id") REFERENCES "ai_interaction_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_recommendations" ADD CONSTRAINT "boundary_recommendations_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_proposals" ADD CONSTRAINT "boundary_proposals_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_adjustment_logs" ADD CONSTRAINT "boundary_adjustment_logs_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "boundary_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
