// controller/otpController.js
const OTP = require('../model/otpmodel');
const sendEmail = require('../utils/node_mailer'); // Change the import name here
const generateOTP = require('../utils/otpgenerator');

const { AUTH_MAIL } = process.env;

const deleteExpiredOTP = async () => {
  try {
    const currentTime = new Date();
    await OTP.deleteMany({ expireAt: { $lt: currentTime } });
  } catch (error) {
    console.error('Error in deleteExpiredOTP:', error);
  }
};

setInterval(deleteExpiredOTP, 0.5 * 60 * 1000);

const sendOTP = async (email) => {
  try {
    if (!email) {
      throw new Error("Provide the email");
    }

    await OTP.deleteOne({ email });

    const generatedOTP = await generateOTP();
    console.log('Generated OTP:', generatedOTP);

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    const mailOptions = {
      from: AUTH_MAIL,
      to: email,
      subject: "Verify the email using this otp",
      html: `<p>Hello user use this OTP to verify your email and continue.</p>
             <p style="color:tomato;font-size:25px;letter-spacing:2px;">
               <b>${generatedOTP}</b>
             </p>
             <p>OTP will expire in<b> 5 minute(s)</b>.</p>`
    };

    console.log('Sending email...');
    await sendEmail(mailOptions); 
    console.log('Email sent');

    const newOtp = new OTP({
      email,
      otp: generatedOTP,
      otpAdded: Date.now(),
      expireAt: expirationTime
    });

    console.log('Saving OTP to database...');
    const createdOtp = await newOtp.save();
    console.log('OTP saved');

    return createdOtp;
  } catch (error) {
    console.error('Error in sendOTP:', error);
    throw error;
  }
};

module.exports = { sendOTP };
