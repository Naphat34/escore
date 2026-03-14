const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/scorer/match/24/end-set',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  console.log('statusCode: ' + res.statusCode);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify({
  setNumber: 1,
  homeScore: 25,
  awayScore: 18,
  duration: 20
}));
req.end();
