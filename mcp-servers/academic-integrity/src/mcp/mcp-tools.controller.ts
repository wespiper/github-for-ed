/**
 * MCP Tools Controller
 * HTTP endpoints for academic integrity tools
 */

import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MCPToolsService } from './mcp-tools.service';

interface PrivacyContextDto {
  requesterId: string;
  requesterType: 'student' | 'educator' | 'system' | 'admin';
  purpose: string;
  educationalJustification?: string;
}

interface DetectAIAssistanceDto {
  studentId: string;
  assignmentId: string;
  content: string;
  privacyContext: PrivacyContextDto;
}

interface AnalyzeIntegrityDto {
  studentId: string;
  assignmentId: string;
  submissionData: {
    content: string;
    metadata?: Record<string, any>;
    writingPatterns?: Record<string, any>;
  };
  privacyContext: PrivacyContextDto;
}

interface ValidateAIUseDto {
  studentId: string;
  assignmentId: string;
  aiInteraction: {
    type: string;
    content: string;
    context?: Record<string, any>;
  };
  privacyContext: PrivacyContextDto;
}

interface GenerateReportDto {
  criteria: {
    reportType: 'individual' | 'class' | 'assignment' | 'course';
    targetId?: string;
    timeframe: {
      start: string;
      end: string;
    };
    includeIndividualData?: boolean;
  };
  privacyContext: PrivacyContextDto;
}

@ApiTags('academic-integrity')
@Controller('api/v1/academic-integrity')
@ApiBearerAuth()
export class MCPToolsController {
  constructor(private readonly mcpToolsService: MCPToolsService) {}

  @Post('detect-ai-assistance')
  @ApiOperation({ 
    summary: 'Detect AI assistance levels',
    description: 'Analyze student work to detect AI assistance levels with privacy protection'
  })
  @ApiResponse({ status: 200, description: 'AI assistance levels detected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async detectAIAssistance(@Body() dto: DetectAIAssistanceDto) {
    return await this.mcpToolsService.detectAIAssistanceLevels(dto);
  }

  @Post('analyze-integrity')
  @ApiOperation({ 
    summary: 'Analyze academic integrity',
    description: 'Comprehensive academic integrity analysis with educational context'
  })
  @ApiResponse({ status: 200, description: 'Academic integrity analyzed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async analyzeIntegrity(@Body() dto: AnalyzeIntegrityDto) {
    return await this.mcpToolsService.analyzeAcademicIntegrity(dto);
  }

  @Post('validate-ai-use')
  @ApiOperation({ 
    summary: 'Validate educational AI use',
    description: 'Validate educational value and boundary compliance of AI interactions'
  })
  @ApiResponse({ status: 200, description: 'AI use validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async validateAIUse(@Body() dto: ValidateAIUseDto) {
    return await this.mcpToolsService.validateEducationalAIUse(dto);
  }

  @Post('generate-report')
  @ApiOperation({ 
    summary: 'Generate integrity reports',
    description: 'Generate comprehensive integrity reports with privacy controls'
  })
  @ApiResponse({ status: 200, description: 'Integrity report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async generateReport(@Body() dto: GenerateReportDto) {
    return await this.mcpToolsService.generateIntegrityReports(dto);
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Check the health status of the Academic Integrity service'
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'academic-integrity-mcp-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      capabilities: [
        'ai-assistance-detection',
        'academic-integrity-analysis',
        'educational-ai-validation',
        'integrity-reporting'
      ]
    };
  }

  @Get('tools')
  @ApiOperation({ 
    summary: 'List available tools',
    description: 'Get list of available academic integrity tools'
  })
  @ApiResponse({ status: 200, description: 'Tools listed successfully' })
  async listTools() {
    return {
      tools: [
        {
          name: 'detect_ai_assistance_levels',
          description: 'Detect AI assistance levels in student work',
          category: 'ai-detection',
          privacyAware: true
        },
        {
          name: 'analyze_academic_integrity',
          description: 'Comprehensive academic integrity analysis',
          category: 'integrity-analysis',
          privacyAware: true
        },
        {
          name: 'validate_educational_ai_use',
          description: 'Validate educational AI interactions',
          category: 'educational-validation',
          privacyAware: true
        },
        {
          name: 'generate_integrity_reports',
          description: 'Generate integrity reports with privacy controls',
          category: 'reporting',
          privacyAware: true
        }
      ]
    };
  }
}