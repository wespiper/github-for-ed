-- Create ReflectionAnalysis table for storing detailed analysis results
CREATE TABLE IF NOT EXISTS "reflection_analyses" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id" TEXT NOT NULL,
  "assignment_id" TEXT NOT NULL,
  "ai_interaction_id" TEXT NOT NULL,
  "reflection_text" TEXT NOT NULL,
  
  -- Depth scores
  "depth_score" INTEGER NOT NULL,
  "reasoning_chains" INTEGER NOT NULL,
  "abstraction_level" INTEGER NOT NULL,
  "evidence_of_thinking" JSONB NOT NULL DEFAULT '[]',
  
  -- Self-awareness scores
  "self_awareness_score" INTEGER NOT NULL,
  "recognizes_gaps" BOOLEAN NOT NULL DEFAULT false,
  "questions_assumptions" BOOLEAN NOT NULL DEFAULT false,
  "identifies_learning_process" BOOLEAN NOT NULL DEFAULT false,
  "articulates_struggle" BOOLEAN NOT NULL DEFAULT false,
  
  -- Critical thinking scores
  "critical_thinking_score" INTEGER NOT NULL,
  "challenges_ai_prompts" BOOLEAN NOT NULL DEFAULT false,
  "offers_alternatives" BOOLEAN NOT NULL DEFAULT false,
  "evaluates_perspectives" BOOLEAN NOT NULL DEFAULT false,
  "synthesizes_ideas" BOOLEAN NOT NULL DEFAULT false,
  
  -- Growth mindset scores
  "growth_mindset_score" INTEGER NOT NULL,
  "focus_on_learning" BOOLEAN NOT NULL DEFAULT false,
  "embraces_challenge" BOOLEAN NOT NULL DEFAULT false,
  "seeks_improvement" BOOLEAN NOT NULL DEFAULT false,
  
  -- Overall assessment
  "overall_quality_score" INTEGER NOT NULL,
  "authenticity_score" INTEGER NOT NULL,
  "progressive_access_level" TEXT NOT NULL CHECK ("progressive_access_level" IN ('restricted', 'basic', 'standard', 'enhanced')),
  "recommendations" JSONB NOT NULL DEFAULT '[]',
  
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "reflection_analyses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "reflection_analyses_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE,
  CONSTRAINT "reflection_analyses_ai_interaction_id_fkey" FOREIGN KEY ("ai_interaction_id") REFERENCES "ai_interaction_logs"("id") ON DELETE CASCADE
);

-- Create StudentProfile table for tracking learning preferences and state
CREATE TABLE IF NOT EXISTS "student_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id" TEXT NOT NULL UNIQUE,
  
  -- Preferences
  "question_complexity" TEXT NOT NULL DEFAULT 'mixed' CHECK ("question_complexity" IN ('concrete', 'mixed', 'abstract')),
  "average_reflection_depth" INTEGER NOT NULL DEFAULT 0,
  "best_responds_to" JSONB NOT NULL DEFAULT '[]',
  "struggles_with" JSONB NOT NULL DEFAULT '[]',
  
  -- Current state
  "current_cognitive_load" TEXT NOT NULL DEFAULT 'optimal' CHECK ("current_cognitive_load" IN ('low', 'optimal', 'high')),
  "recent_breakthrough" BOOLEAN NOT NULL DEFAULT false,
  "struggling_duration" INTEGER NOT NULL DEFAULT 0, -- minutes
  "last_successful_interaction" TIMESTAMP(3),
  "last_activity_time" TIMESTAMP(3),
  
  -- Independence metrics
  "ai_request_frequency" DOUBLE PRECISION NOT NULL DEFAULT 0, -- requests per hour
  "independent_work_streak" INTEGER NOT NULL DEFAULT 0, -- minutes
  "quality_without_ai" INTEGER NOT NULL DEFAULT 0, -- 0-100
  "independence_trend" TEXT NOT NULL DEFAULT 'stable' CHECK ("independence_trend" IN ('increasing', 'stable', 'decreasing')),
  
  -- Session metrics (JSONB for flexibility)
  "session_metrics" JSONB NOT NULL DEFAULT '{}',
  
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "student_profiles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX "reflection_analyses_student_id_idx" ON "reflection_analyses"("student_id");
CREATE INDEX "reflection_analyses_assignment_id_idx" ON "reflection_analyses"("assignment_id");
CREATE INDEX "reflection_analyses_created_at_idx" ON "reflection_analyses"("created_at");
CREATE INDEX "reflection_analyses_quality_score_idx" ON "reflection_analyses"("overall_quality_score");
CREATE INDEX "reflection_analyses_access_level_idx" ON "reflection_analyses"("progressive_access_level");

CREATE INDEX "student_profiles_cognitive_load_idx" ON "student_profiles"("current_cognitive_load");
CREATE INDEX "student_profiles_independence_trend_idx" ON "student_profiles"("independence_trend");

-- Add reflection quality summary to ai_interaction_logs
ALTER TABLE "ai_interaction_logs" 
ADD COLUMN IF NOT EXISTS "reflection_quality_score" INTEGER,
ADD COLUMN IF NOT EXISTS "reflection_submitted_at" TIMESTAMP(3);

-- Create view for easy access to student reflection summaries
CREATE OR REPLACE VIEW "student_reflection_summaries" AS
SELECT 
  s.student_id,
  s.assignment_id,
  COUNT(DISTINCT s.id) as total_reflections,
  AVG(s.overall_quality_score) as avg_quality_score,
  AVG(s.authenticity_score) as avg_authenticity_score,
  MAX(s.created_at) as last_reflection_date,
  MODE() WITHIN GROUP (ORDER BY s.progressive_access_level) as most_common_access_level
FROM reflection_analyses s
GROUP BY s.student_id, s.assignment_id;