const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, fetchAdminUserById, fetchAdminUserByUsername) {
  const authenticateUser = async (username, password, done) => {
    try {
      const user = await fetchAdminUserByUsername(username);
  
      if (!user) {
        return done(null, false, { message: 'No user with that username' });
      }
  
      const isPasswordMatch = user.password ? await bcrypt.compare(password, user.password) : false;
  
      if (isPasswordMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (error) {
      return done(error);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await fetchAdminUserById(id);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  });
}

module.exports = initialize;