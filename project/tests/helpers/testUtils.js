// tests/helpers/testUtils.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const userRepository = require('../../src/repositories/user.repository');

async function createAdminUser({
  name = 'System Admin',
  email = 'admin@example.com',
  password = 'adminpassword123',
} = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'admin',
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return { user, token };
}

module.exports = {
  createAdminUser,
};

