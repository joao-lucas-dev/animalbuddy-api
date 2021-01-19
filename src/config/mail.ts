export default {
  host: process.env.NODEMAILER_HOST,
  port: 2525,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
  default: {
    from: 'AnimalBuddy <contato@animalbuddy.com.br>',
  },
};
