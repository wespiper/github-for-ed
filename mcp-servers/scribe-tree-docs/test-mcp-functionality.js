const { ScribeTreeDocsServer } = require('./dist/server.js');

async function testMCPFunctionality() {
  console.log('Testing ScribeTree Docs MCP Server functionality...\n');
  
  const server = new ScribeTreeDocsServer();
  await server.initialize('/Users/wnp/Desktop/scribe-tree');
  
  // Test 1: Search for "educational component architecture"
  console.log('🔍 Test 1: Search for "educational component architecture"');
  try {
    const results1 = await server.searchEngine.search({
      query: "educational component architecture",
      includeContent: true
    }, 10);
    
    console.log(`Found ${results1.length} results:`);
    results1.slice(0, 3).forEach((result, i) => {
      console.log(`  ${i+1}. ${result.document.title} (Type: ${result.document.type}, Score: ${result.relevanceScore?.toFixed(2) || 'N/A'})`);
      console.log(`     Path: ${result.document.path}`);
      if (result.matchedContent && result.matchedContent.length > 0) {
        console.log(`     Excerpt: ${result.matchedContent[0].snippet.substring(0, 100)}...`);
      }
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log('');

  // Test 2: Search for "Sprint 2"
  console.log('🔍 Test 2: Search for "Sprint 2"');
  try {
    const results2 = await server.searchEngine.search({
      query: "Sprint 2",
      includeContent: true
    }, 10);
    
    console.log(`Found ${results2.length} results:`);
    results2.slice(0, 3).forEach((result, i) => {
      console.log(`  ${i+1}. ${result.document.title} (Type: ${result.document.type}, Score: ${result.relevanceScore?.toFixed(2) || 'N/A'})`);
      console.log(`     Path: ${result.document.path}`);
      if (result.matchedContent && result.matchedContent.length > 0) {
        console.log(`     Excerpt: ${result.matchedContent[0].snippet.substring(0, 100)}...`);
      }
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log('');

  // Test 3: Search for "authentication"
  console.log('🔍 Test 3: Search for "authentication"');
  try {
    const results3 = await server.searchEngine.search({
      query: "authentication",
      includeContent: true
    }, 10);
    
    console.log(`Found ${results3.length} results:`);
    results3.slice(0, 3).forEach((result, i) => {
      console.log(`  ${i+1}. ${result.document.title} (Type: ${result.document.type}, Score: ${result.relevanceScore?.toFixed(2) || 'N/A'})`);
      console.log(`     Path: ${result.document.path}`);
      if (result.matchedContent && result.matchedContent.length > 0) {
        console.log(`     Excerpt: ${result.matchedContent[0].snippet.substring(0, 100)}...`);
      }
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log('');

  // Test 4: List documents by type
  console.log('📄 Test 4: List documents of type "reflection" and "insight"');
  try {
    const reflections = await server.documentManager.listDocuments({ type: 'reflection' });
    const insights = await server.documentManager.listDocuments({ type: 'insight' });
    
    console.log(`Reflections found: ${reflections.length}`);
    reflections.slice(0, 3).forEach((doc, i) => {
      console.log(`  ${i+1}. ${doc.title} (${doc.lastModified})`);
      console.log(`     Path: ${doc.path}`);
    });
    
    console.log(`\nInsights found: ${insights.length}`);
    insights.slice(0, 3).forEach((doc, i) => {
      console.log(`  ${i+1}. ${doc.title} (${doc.lastModified})`);
      console.log(`     Path: ${doc.path}`);
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log('');

  // Test 5: Search for "MongoDB migration"
  console.log('🔍 Test 5: Search for "MongoDB migration"');
  try {
    const results5 = await server.searchEngine.search({
      query: "MongoDB migration",
      includeContent: true
    }, 10);
    
    console.log(`Found ${results5.length} results:`);
    results5.slice(0, 3).forEach((result, i) => {
      console.log(`  ${i+1}. ${result.document.title} (Type: ${result.document.type}, Score: ${result.relevanceScore?.toFixed(2) || 'N/A'})`);
      console.log(`     Path: ${result.document.path}`);
      if (result.matchedContent && result.matchedContent.length > 0) {
        console.log(`     Excerpt: ${result.matchedContent[0].snippet.substring(0, 100)}...`);
      }
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log('');

  console.log('✅ MCP Server functionality testing complete!');
}

testMCPFunctionality().catch(console.error);