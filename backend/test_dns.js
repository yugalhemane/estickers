const dns = require('dns');

console.log("Testing SRV DNS...");

dns.resolveSrv('_mongodb._tcp.cluster0.3g4vlzl.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("SRV Lookup Failed:", err.message);
  } else {
    console.log("SRV Addresses:", addresses);
  }
});

console.log("Testing regular DNS...");
dns.resolve4('cluster0.3g4vlzl.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("A Record Lookup Failed:", err.message);
  } else {
    console.log("A Addresses:", addresses);
  }
});
