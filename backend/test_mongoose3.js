import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const url = 'mongodb+srv://yugalhemane:vrIghhAc1JLb95r9@cluster0.3g4vlzl.mongodb.net/esticker';
mongoose.connect(url)
  .then(() => { console.log("Connected successfully with 8.8.8.8 DNS"); process.exit(0); })
  .catch(err => { console.error("Failed with 8.8.8.8 DNS:", err.message); });
