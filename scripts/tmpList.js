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
    console.log('Connecting with uri present?', !!uri);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

    const col = mongoose.connection.collection('volunteers');
    const rows = await col.find({}, { projection: { volunteerId: 1, firstName: 1, lastName: 1, segment: 1 } }).limit(20).toArray();
    console.log('rows:', rows.length);
    rows.forEach(r => {
      const name = (r.firstName && r.lastName) ? (r.firstName + ' ' + r.lastName) : null;
      console.log(JSON.stringify({ _id: r._id, volunteerId: r.volunteerId || null, name, segment: r.segment || null }));
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('ERR', e && (e.message || e));
    process.exit(2);
  }
})();
