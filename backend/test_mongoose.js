import mongoose from 'mongoose';
const url = 'mongodb+srv://yugalhemane:vrIghhAc1JLb95r9@cluster0.3g4vlzl.mongodb.net/esticker';
mongoose.connect(url)
  .then(() => { console.log("Connected normal"); process.exit(0); })
  .catch(err => { console.error("Normal fail:", err.message); });

setTimeout(() => {
  mongoose.connect(url, { family: 4 })
    .then(() => { console.log("Connected family 4"); process.exit(0); })
    .catch(err => { console.error("Family 4 fail:", err.message); });
}, 2000);
