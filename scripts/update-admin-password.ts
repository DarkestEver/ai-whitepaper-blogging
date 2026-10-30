import mongoose from 'mongoose';

const mongoUri = 'mongodb://localhost:27017/wpblog';
const newPasswordHash = 'scrypt$23a90f2e6793a37afb4f9297f1493858$49983625cc0f53f9a127a3443e88c051cbf65e8216c40cbd2b0d9340adb15aad5bfcd50259df4c5f2de4d50451f492b44bc879b7429d69b7c2d3dad9d49e7a92';

async function updateAdminPassword() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const result = await mongoose.connection.db?.collection('users').updateOne(
      { username: 'admin' },
      { $set: { passwordHash: newPasswordHash } }
    );

    if (!result) {
      console.error('Update failed');
      process.exit(1);
    }

    console.log(`✓ Matched: ${result.matchedCount} user(s)`);
    console.log(`✓ Updated: ${result.modifiedCount} user(s)`);

    if (result.matchedCount === 0) {
      console.log('ℹ No admin user found. It will be created on first login.');
    }

    await mongoose.disconnect();
    console.log('✓ Done');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

updateAdminPassword();
