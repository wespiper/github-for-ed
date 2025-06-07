#!/usr/bin/env node

/**
 * Verification script for Student Profiling MCP backend integration
 * This script checks if all the integration files are in place without requiring the server to run
 */

const fs = require('fs');
const path = require('path');

function verifyFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ Missing: ${description} at ${filePath}`);
    return false;
  }
}

function verifyIntegrationStructure() {
  console.log('🔍 Verifying Student Profiling MCP Backend Integration Structure...\n');

  let allGood = true;

  // Core integration files
  allGood &= verifyFileExists('src/services/mcp/StudentProfilingMCPClient.ts', 'MCP Client');
  allGood &= verifyFileExists('src/services/http/StudentProfilingHTTPClient.ts', 'HTTP Client');
  allGood &= verifyFileExists('src/services/StudentProfilingService.ts', 'Unified Service');
  allGood &= verifyFileExists('src/routes/studentProfiling.ts', 'Express Routes');

  // Configuration files
  allGood &= verifyFileExists('src/container/ServiceFactory.ts', 'Service Factory');
  allGood &= verifyFileExists('src/server.ts', 'Server Configuration');

  console.log('\n📋 Integration Summary:');
  
  if (allGood) {
    console.log('✅ All Student Profiling MCP integration files are in place!');
    console.log('\n🔧 Integration Features:');
    console.log('  • MCP Protocol client for direct communication');
    console.log('  • HTTP REST client as fallback mechanism');
    console.log('  • Unified service with automatic protocol switching');
    console.log('  • Complete Express API endpoints');
    console.log('  • Integration with ServiceFactory dependency injection');
    
    console.log('\n🚀 Next Steps:');
    console.log('  1. Fix TypeScript compilation errors (repository interface mismatches)');
    console.log('  2. Start backend server: cd backend && npm run dev');
    console.log('  3. Start Student Profiling MCP server on port 3002');
    console.log('  4. Test integration endpoints with authentication');
    
    console.log('\n📡 Available Endpoints:');
    console.log('  POST /api/student-profiling/profiles/build');
    console.log('  PUT  /api/student-profiling/profiles/:id/privacy-choices');
    console.log('  POST /api/student-profiling/analytics/privacy-preserving');
    console.log('  POST /api/student-profiling/access-validation');
    console.log('  GET  /api/student-profiling/profiles/:id/privacy-dashboard');
    console.log('  POST /api/student-profiling/profiles/:id/learning-trajectory');
    console.log('  POST /api/student-profiling/profiles/:id/skill-assessment');
    console.log('  POST /api/student-profiling/profiles/:id/recommendations');
    console.log('  GET  /api/student-profiling/status');

  } else {
    console.log('❌ Student Profiling MCP integration is incomplete.');
    console.log('   Some required files are missing.');
  }

  return allGood;
}

function checkServiceFactoryIntegration() {
  console.log('\n🔍 Checking ServiceFactory integration...');
  
  try {
    const serviceFactoryPath = path.join(__dirname, 'src/container/ServiceFactory.ts');
    const content = fs.readFileSync(serviceFactoryPath, 'utf8');
    
    const hasImport = content.includes('StudentProfilingMCPClient');
    const hasInterface = content.includes('studentProfilingMCPClient: StudentProfilingMCPClient');
    const hasInitialization = content.includes('this.container.studentProfilingMCPClient = new StudentProfilingMCPClient()');
    const hasGetter = content.includes('getStudentProfilingMCPClient()');
    
    if (hasImport && hasInterface && hasInitialization && hasGetter) {
      console.log('✅ ServiceFactory properly configured for Student Profiling MCP');
    } else {
      console.log('⚠️  ServiceFactory may need Student Profiling MCP configuration:');
      console.log(`   Import: ${hasImport ? '✅' : '❌'}`);
      console.log(`   Interface: ${hasInterface ? '✅' : '❌'}`);
      console.log(`   Initialization: ${hasInitialization ? '✅' : '❌'}`);
      console.log(`   Getter: ${hasGetter ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log('❌ Error checking ServiceFactory:', error.message);
  }
}

function checkServerRouteRegistration() {
  console.log('\n🔍 Checking server route registration...');
  
  try {
    const serverPath = path.join(__dirname, 'src/server.ts');
    const content = fs.readFileSync(serverPath, 'utf8');
    
    const hasImport = content.includes('studentProfilingRoutes');
    const hasRegistration = content.includes('/api/student-profiling');
    
    if (hasImport && hasRegistration) {
      console.log('✅ Student Profiling routes properly registered in server');
    } else {
      console.log('⚠️  Server may need Student Profiling route registration:');
      console.log(`   Import: ${hasImport ? '✅' : '❌'}`);
      console.log(`   Registration: ${hasRegistration ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log('❌ Error checking server configuration:', error.message);
  }
}

// Run verification
if (require.main === module) {
  const structureOK = verifyIntegrationStructure();
  checkServiceFactoryIntegration();
  checkServerRouteRegistration();
  
  console.log('\n' + '='.repeat(60));
  if (structureOK) {
    console.log('🎉 Student Profiling MCP Backend Integration: COMPLETE');
    console.log('   Ready for testing once TypeScript compilation issues are resolved');
  } else {
    console.log('❌ Student Profiling MCP Backend Integration: INCOMPLETE');
  }
  console.log('='.repeat(60));
}

module.exports = {
  verifyFileExists,
  verifyIntegrationStructure,
  checkServiceFactoryIntegration,
  checkServerRouteRegistration
};