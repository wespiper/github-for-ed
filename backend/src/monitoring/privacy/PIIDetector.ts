import { Logger } from '../Logger';

interface PIIPattern {
  name: string;
  pattern: RegExp;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  replacement: string;
}

interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  redactedContent: string;
  originalContent: string;
  detectionCount: number;
}

interface PIIDetectionConfig {
  enableAdvancedDetection: boolean;
  preserveAnalytics: boolean;
  hashSensitiveData: boolean;
  strictMode: boolean;
}

export class PIIDetector {
  private static instance: PIIDetector;
  private logger: Logger;
  private config: PIIDetectionConfig;
  private patterns: PIIPattern[] = [];

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = {
      enableAdvancedDetection: true,
      preserveAnalytics: true,
      hashSensitiveData: true,
      strictMode: true
    };
    this.initializePatterns();
  }

  public static getInstance(): PIIDetector {
    if (!PIIDetector.instance) {
      PIIDetector.instance = new PIIDetector();
    }
    return PIIDetector.instance;
  }

  private initializePatterns(): void {
    this.patterns = [
      // Critical PII Patterns
      {
        name: 'ssn',
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        sensitivity: 'critical',
        replacement: '[SSN-REDACTED]'
      },
      {
        name: 'creditCard',
        pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        sensitivity: 'critical',
        replacement: '[CARD-REDACTED]'
      },
      
      // High Sensitivity PII
      {
        name: 'email',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        sensitivity: 'high',
        replacement: '[EMAIL-REDACTED]'
      },
      {
        name: 'phone',
        pattern: /\b(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
        sensitivity: 'high',
        replacement: '[PHONE-REDACTED]'
      },
      {
        name: 'studentId',
        pattern: /\b(?:(?:student|id|stud)[-_\s]*(?:id|number|num)[-_\s]*:?\s*([A-Za-z0-9]{6,12})|STU\d{6,12}|[A-Z]{2,4}\d{6,12})\b/gi,
        sensitivity: 'high',
        replacement: '[STUDENT-ID-REDACTED]'
      },
      
      // Medium Sensitivity PII
      {
        name: 'ipAddress',
        pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        sensitivity: 'medium',
        replacement: '[IP-REDACTED]'
      },
      {
        name: 'zipCode',
        pattern: /\b\d{5}(?:-\d{4})?\b/g,
        sensitivity: 'medium',
        replacement: '[ZIP-REDACTED]'
      },
      {
        name: 'dateOfBirth',
        pattern: /\b(?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}\b/g,
        sensitivity: 'medium',
        replacement: '[DOB-REDACTED]'
      },
      
      // Educational Context PII
      {
        name: 'gradeLevel',
        pattern: /\b(?:grade|level)\s*:?\s*(K|[1-9]|1[012]|kindergarten|freshman|sophomore|junior|senior)\b/gi,
        sensitivity: 'medium',
        replacement: '[GRADE-REDACTED]'
      },
      {
        name: 'schoolName',
        pattern: /\b(?:school|university|college|academy)\s*:?\s*([A-Za-z\s]{3,30})\b/gi,
        sensitivity: 'medium',
        replacement: '[SCHOOL-REDACTED]'
      },
      
      // Advanced Name Detection (High Risk)
      {
        name: 'fullName',
        pattern: /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?\b/g,
        sensitivity: 'high',
        replacement: '[NAME-REDACTED]'
      },
      
      // Low Sensitivity but Trackable
      {
        name: 'username',
        pattern: /\b(?:user|username|login)[-_\s]*:?\s*([A-Za-z0-9_-]{3,20})\b/gi,
        sensitivity: 'low',
        replacement: '[USERNAME-REDACTED]'
      }
    ];
  }

  public detectAndRedact(content: string, options?: Partial<PIIDetectionConfig>): PIIDetectionResult {
    const config = { ...this.config, ...options };
    
    if (!content || typeof content !== 'string') {
      return {
        hasPII: false,
        detectedTypes: [],
        redactedContent: content || '',
        originalContent: content || '',
        detectionCount: 0
      };
    }

    let redactedContent = content;
    const detectedTypes: string[] = [];
    let totalDetections = 0;

    // Apply PII detection patterns
    for (const pattern of this.patterns) {
      const matches = content.match(pattern.pattern);
      if (matches && matches.length > 0) {
        detectedTypes.push(pattern.name);
        totalDetections += matches.length;
        
        // Apply redaction based on sensitivity and config
        if (this.shouldRedact(pattern.sensitivity, config)) {
          if (config.hashSensitiveData && pattern.sensitivity === 'critical') {
            redactedContent = redactedContent.replace(pattern.pattern, (match) => {
              const hash = this.hashSensitiveValue(match);
              return `[${pattern.name.toUpperCase()}-${hash}]`;
            });
          } else {
            redactedContent = redactedContent.replace(pattern.pattern, pattern.replacement);
          }
        }
        
        // Log detection for monitoring
        this.logPIIDetection(pattern.name, pattern.sensitivity, matches.length);
      }
    }

    const result: PIIDetectionResult = {
      hasPII: detectedTypes.length > 0,
      detectedTypes,
      redactedContent,
      originalContent: content,
      detectionCount: totalDetections
    };

    // Advanced ML-based detection (placeholder for future enhancement)
    if (config.enableAdvancedDetection) {
      this.performAdvancedDetection(result);
    }

    return result;
  }

  private shouldRedact(sensitivity: string, config: PIIDetectionConfig): boolean {
    if (config.strictMode) {
      return true; // Redact all detected PII in strict mode
    }
    
    // In non-strict mode, only redact medium and higher sensitivity
    return ['medium', 'high', 'critical'].includes(sensitivity);
  }

  private hashSensitiveValue(value: string): string {
    // Simple hash for demonstration - in production, use crypto module
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substr(0, 6);
  }

  private logPIIDetection(type: string, sensitivity: string, count: number): void {
    this.logger.warn('PII_DETECTED', {
      piiType: type,
      sensitivity,
      detectionCount: count,
      timestamp: new Date().toISOString()
    });
  }

  private performAdvancedDetection(result: PIIDetectionResult): void {
    // Placeholder for ML-based PII detection
    // This would integrate with NLP models to detect:
    // - Context-based names
    // - Indirect identifiers
    // - Educational-specific sensitive information
    
    const content = result.redactedContent;
    
    // Educational context detection
    if (this.detectEducationalContext(content)) {
      result.detectedTypes.push('educational_context');
    }
    
    // Behavioral pattern detection
    if (this.detectBehavioralPatterns(content)) {
      result.detectedTypes.push('behavioral_pattern');
    }
  }

  private detectEducationalContext(content: string): boolean {
    const educationalKeywords = [
      'assignment', 'homework', 'quiz', 'test', 'exam',
      'teacher', 'student', 'class', 'course', 'subject',
      'grade', 'score', 'performance', 'attendance'
    ];
    
    const keywordCount = educationalKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;
    
    return keywordCount >= 3; // Threshold for educational context
  }

  private detectBehavioralPatterns(content: string): boolean {
    // Detect patterns that might reveal behavioral or learning data
    const behavioralIndicators = [
      /time\s+spent/gi,
      /difficulty\s+level/gi,
      /learning\s+style/gi,
      /progress\s+rate/gi,
      /engagement\s+score/gi
    ];
    
    return behavioralIndicators.some(pattern => pattern.test(content));
  }

  public getDetectionStats(): {
    totalPatterns: number;
    criticalPatterns: number;
    highSensitivityPatterns: number;
    lastUpdate: Date;
  } {
    return {
      totalPatterns: this.patterns.length,
      criticalPatterns: this.patterns.filter(p => p.sensitivity === 'critical').length,
      highSensitivityPatterns: this.patterns.filter(p => p.sensitivity === 'high').length,
      lastUpdate: new Date()
    };
  }

  public updateConfig(newConfig: Partial<PIIDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('PII_DETECTOR_CONFIG_UPDATED', {
      config: this.config,
      timestamp: new Date().toISOString()
    });
  }

  public addCustomPattern(pattern: PIIPattern): void {
    this.patterns.push(pattern);
    this.logger.info('CUSTOM_PII_PATTERN_ADDED', {
      patternName: pattern.name,
      sensitivity: pattern.sensitivity,
      timestamp: new Date().toISOString()
    });
  }
}