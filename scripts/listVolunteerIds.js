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

    // Print a sample of volunteerId values and basic metadata
    const cursor = col.find({}, { projection: { volunteerId: 1, firstName: 1, lastName: 1, segment: 1 } }).sort({ lastName: 1 }).limit(200);
    const rows = await cursor.toArray();

    console.log(`Found ${rows.length} volunteers (sample):`);
    for (const r of rows) {
      console.log(JSON.stringify({ _id: r._id, volunteerId: r.volunteerId || null, name: (r.firstName && r.lastName) ? `${r.firstName} ${r.lastName}` : null, segment: r.segment || null }));
    }

    // Stats: count how many have volunteerId
    const total = await col.countDocuments();
    const withId = await col.countDocuments({ volunteerId: { $exists: true, $ne: null, $ne: "" } });
    console.log(`\nTotal volunteers: ${total}`);
    console.log(`With volunteerId: ${withId} (${Math.round((withId/total)*100)}%)`);

    process.exit(0);
  } catch (err) {
    console.error('Error listing volunteers:', err);
    process.exit(2);
  }
})();
