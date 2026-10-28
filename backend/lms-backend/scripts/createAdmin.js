require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + ' is required. Set it in your environment before running this script.');
  return value;
}

(async () => {
  try {
    const mongoUri = requiredEnv('MONGO_URI');
    const name = requiredEnv('NEW_ADMIN_NAME');
    const email = requiredEnv('NEW_ADMIN_EMAIL').toLowerCase();
    const password = requiredEnv('NEW_ADMIN_PASSWORD');

    if (password.length < 12) throw new Error('NEW_ADMIN_PASSWORD must be at least 12 characters long.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('NEW_ADMIN_EMAIL must be a valid email address.');

    await mongoose.connect(mongoUri);
    const existing = await User.findOne({ email }).select('_id email role');
    if (existing) throw new Error('A user with email ' + email + ' already exists. No changes were made.');

    // The User model pre-save hook hashes the password with bcryptjs.
    const admin = await User.create({ name, email, password, role: 'admin', isActive: true });
    console.log('Admin created successfully: ' + admin.email + ' (' + admin._id + ')');
    console.log('Password was hashed by the User model and was not printed.');
  } catch (error) {
    console.error('Admin creation failed: ' + error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect().catch(() => {});
  }
})();
