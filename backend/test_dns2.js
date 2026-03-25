import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log("Testing SRV DNS with 8.8.8.8...");

dns.resolveSrv('_mongodb._tcp.cluster0.3g4vlzl.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("SRV Lookup Failed:", err.message);
  } else {
    console.log("SRV Addresses:", addresses);
  }
});
