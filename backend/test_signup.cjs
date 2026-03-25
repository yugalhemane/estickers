const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
  name: "Test User 2",
  email: "test_user_AG_2@example.com",
  password: "password123",
  phone: "1234567890"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log("Sending signup request...");

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';

  res.on('data', d => {
    body += d;
  });

  res.on('end', () => {
    console.log("Response body:", body);
    fs.writeFileSync('signup_test_output.txt', `Status: ${res.statusCode}\nBody: ${body}\n`);
  });
});

req.on('error', error => {
  console.error("Error:", error);
  fs.writeFileSync('signup_test_output.txt', `Error: ${error.message}\n`);
});

req.write(data);
req.end();
