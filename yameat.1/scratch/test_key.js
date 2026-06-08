const apiKey = 'sk_live_zPeO7Qfig68YMAULwJBpM44Qlt7aIDUcDQlmXwgn8c6251d0';

const endpoints = [
  'https://api-lct-prod.elice.io/api/v1/chat/completions',
  'https://api-lct-prod.elice.io/v1/chat/completions',
  'https://api-lct-prod.elice.io/api/chat/completions',
  'https://api.elice.io/v1/chat/completions',
  'https://api.elice.io/api/v1/chat/completions',
  'https://api.elice.io/api/chat/completions',
  'https://api-cloud.elice.io/v1/chat/completions',
  'https://api-cloud.elice.io/api/v1/chat/completions',
  'https://api.elice.cloud/api/v1/chat/completions',
  'https://api.elice.cloud/v1/chat/completions'
];

async function testEndpoints() {
  for (const url of endpoints) {
    console.log(`Testing endpoint: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // will try standard or if Elice has custom
          messages: [{ role: 'user', content: 'hello' }]
        })
      });
      console.log(`Status: ${response.status}`);
      const text = await response.text();
      console.log(`Response: ${text.slice(0, 300)}`);
      if (response.status === 200) {
        console.log(`SUCCESS on: ${url}`);
      }
    } catch (error) {
      console.error(`Error on ${url}:`, error.message);
    }
    console.log('-----------------------------------------');
  }
}

testEndpoints();
