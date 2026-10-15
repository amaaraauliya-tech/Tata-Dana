async function testLiveOTP() {
  console.log('--- TESTING LIVE OTP ENDPOINTS ON LOCALHOST:3001 ---');
  
  // 1. Send OTP
  const sendRes = await fetch('http://localhost:3001/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'live.user@tatadana.id' })
  });
  
  const sendData = await sendRes.json();
  console.log('1. Send OTP Response:', sendData);
  if (!sendData.ok || !sendData.otpCode) {
    throw new Error('Failed to send OTP: ' + JSON.stringify(sendData));
  }

  // 2. Verify with wrong code
  const wrongRes = await fetch('http://localhost:3001/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'live.user@tatadana.id', code: '000000' })
  });
  const wrongData = await wrongRes.json();
  console.log('2. Verify Wrong OTP Response (expected error):', wrongData);
  if (wrongData.ok) {
    throw new Error('Wrong code should have failed!');
  }

  // 3. Verify with correct code
  const correctRes = await fetch('http://localhost:3001/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'live.user@tatadana.id', code: sendData.otpCode })
  });
  const correctData = await correctRes.json();
  console.log('3. Verify Correct OTP Response:', correctData);
  if (!correctData.ok || !correctData.verified) {
    throw new Error('Correct OTP verification failed!');
  }

  console.log('🎉 LIVE OTP ENDPOINTS WORK 100% PERFECTLY! 🎉');
}

testLiveOTP().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
