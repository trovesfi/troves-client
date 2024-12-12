async function testRateLimit(url: string, attempts: number) {
  console.log(`Testing rate limit for ${url}`);
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(url);
    const remaining = response.headers.get('X-RateLimit-Remaining');
    console.log(
      `Attempt ${i + 1}: Status ${response.status}, Remaining: ${remaining}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms between requests
  }
  console.log('\n');
}

async function runTests() {
  const baseUrl = 'http://localhost:3000/api';
  await testRateLimit(`${baseUrl}/price`, 25);
  await testRateLimit(`${baseUrl}/raffle`, 25);
  await testRateLimit(`${baseUrl}/raffle/luckyWinner`, 25);
  await testRateLimit(`${baseUrl}/referral/createUser`, 25);
  await testRateLimit(`${baseUrl}/stats`, 25);
  await testRateLimit(`${baseUrl}/stats/[address]`, 25);
  await testRateLimit(`${baseUrl}/strategies`, 25);
  await testRateLimit(`${baseUrl}/tnc/getUser`, 25);
  await testRateLimit(`${baseUrl}/tnc/getUser/[address]`, 25);
  await testRateLimit(`${baseUrl}/tnc/signUser`, 25);
  await testRateLimit(`${baseUrl}/users/ognft`, 25);
  await testRateLimit(`${baseUrl}/users/ognft/[address]`, 25);
}

runTests().catch(console.error);
