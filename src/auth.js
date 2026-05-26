const bcrypt = require("bcryptjs");

function isAuthenticated(req, res, next) {
  if (req.session && req.session.isAdminLoggedIn) {
    return next();
  }
  return res.redirect("/secure-mla-login");
}

async function isValidAdminPassword(plainPassword) {
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (expectedHash) {
    return bcrypt.compare(plainPassword, expectedHash);
  }

  return plainPassword === expectedPassword;
}

module.exports = {
  isAuthenticated,
  isValidAdminPassword
};
