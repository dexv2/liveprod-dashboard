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
    // Fallback to process.env if available
    uri = uri || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in environment');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });

  const id = process.argv[2] || 'A313273';
  const volunteer = await mongoose.connection.collection('volunteers').findOne({ volunteerId: { $regex: new RegExp('^' + id + '$', 'i') } });

    if (!volunteer) {
      console.log(`No volunteer found with volunteerId: ${id}`);
      process.exit(0);
    }

    console.log('Found volunteer:');
    console.log(JSON.stringify(volunteer, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying volunteer:', err);
    process.exit(2);
  }
})();
