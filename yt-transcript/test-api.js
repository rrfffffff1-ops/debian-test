// Simple test to verify API routes are accessible
async function testApiRoutes() {
  try {
    console.log('Testing API routes...');
    
    // Test transcript route (will fail without valid URL but should show it's accessible)
    const transcriptResponse = await fetch('http://localhost:3000/api/transcript?url=invalid');
    console.log('Transcript route status:', transcriptResponse.status);
    
    // Test summarize route (will fail without data but should show it's accessible)
    const summarizeResponse = await fetch('http://localhost:3000/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log('Summarize route status:', summarizeResponse.status);
    
    console.log('API routes are accessible!');
  } catch (error) {
    console.error('Error testing API routes:', error.message);
  }
}

testApiRoutes();
