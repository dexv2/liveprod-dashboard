(async () => {
  try {
    const mongoose = require('mongoose');
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(__dirname, '../.env');
    let uri;
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, 'utf8');
      const match = env.match(/^MONGODB_URI=(.+)$/m);
      if (match) uri = match[1].trim();
    }
    uri = uri || process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in environment');

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    const col = mongoose.connection.collection('volunteers');

    const shouldExist = ['A313273', 'A405975'];
    const shouldNotExist = ['NOTFOUNDID12345'];

    let ok = true;

    for (const id of shouldExist) {
      const v = await col.findOne({ volunteerId: { $regex: new RegExp('^' + id + '$', 'i') } });
      if (!v) {
        console.error(`Expected to find ${id} but did not.`);
        ok = false;
      } else {
        console.log(`Found ${id} -> _id=${v._id}`);
      }
    }

    for (const id of shouldNotExist) {
      const v = await col.findOne({ volunteerId: { $regex: new RegExp('^' + id + '$', 'i') } });
      if (v) {
        console.error(`Expected NOT to find ${id}, but found: ${v._id}`);
        ok = false;
      } else {
        console.log(`Correctly did not find ${id}`);
      }
    }

    await mongoose.disconnect();
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error('Error running lookup test:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
