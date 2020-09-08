const bcrypt = require('bcrypt');
const owasp = require('owasp-password-strength-test');
owasp.config({
  allowPassphrases: false,
  maxLength: 128,
  minLength: 8
});

const auth = require('basic-auth');
const logg = require('../logger');

const validatePwd = password => {
  const passwordTest = owasp.test(password);
  if (passwordTest.strong == false) {
    throw new Error(passwordTest.errors[0]);
    logg.error({ error: passwordTest.errors[0].toString() });
  }
};

const validatePwdHashEncoding = password => {
  return password;
};

const validateUser = async (req, User) => {
  const creds = auth(req);
  console.log(creds.name);
  if (!creds || !creds.name || !creds.pass) {
    throw new Error('Invalid Credentials');
    logg.error({ error: 'Invalid Credentials' });
  }
  const user = await User.findOne({
    where: {
      email_address: creds.name
    }
  });
  if (!user) {
    throw new Error('User Not Found');
    logg.error({ error: 'User Not Found' });
  }
  const validatePwdHashEncoding = await bcrypt.compare(
      creds.pass,
      user.password
  );
  if (!validatePwdHashEncoding){
    throw new Error('Invalid Credentials');
    logg.error({ error: 'Invalid Credentials' });
  }

  // if (validatePwdHashEncoding(creds.pass) !== user.password) {
  //   throw new Error('Invalid Credentials');
  // }
  return user;
};
module.exports = {
  validatePwd,
  validatePwdHashEncoding,
  validateUser
};
