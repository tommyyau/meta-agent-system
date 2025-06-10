#!/usr/bin/env node

/**
 * Debug script to test profile detection components
 */

const BASE_URL = 'http://localhost:3000';

async function testSimpleCase() {
  console.log('🔍 Testing Simple Profile Detection Case\n');

  const testInput = "I need help creating a simple e-commerce website";

  try {
    const response = await fetch(`${BASE_URL}/api/profile/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: testInput,
        sessionId: 'debug-test'
      })
    });

    const data = await response.text();
    console.log('Raw response:', data);

    if (response.ok) {
      const parsed = JSON.parse(data);
      console.log('✅ Success');
      console.log('Profile:', parsed.result?.profile);
    } else {
      console.log('❌ Error:', response.status);
      try {
        const error = JSON.parse(data);
        console.log('Error details:', error);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }

  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function testCapabilities() {
  console.log('\n🔍 Testing Capabilities Endpoint\n');

  try {
    const response = await fetch(`${BASE_URL}/api/profile/detect`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Capabilities endpoint working');
      console.log('Industries:', data.capabilities.industries);
    } else {
      console.log('❌ Capabilities endpoint failed');
    }

  } catch (error) {
    console.log('❌ Capabilities test failed:', error.message);
  }
}

async function main() {
  console.log('🐛 Profile Detection Debug\n');
  
  await testCapabilities();
  await testSimpleCase();
}

main().catch(console.error); 