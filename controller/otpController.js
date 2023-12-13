const OTP = require('../model/otpmodel');
const user = require('../model/usermodel');
const { error } = require('console');
const mail = require('../utils/node_mailer');
const generateOTP = require('../utils/otpgenerator');

const { AUTH_MAIL } = process.env;

// Function to delete expired OTPs
const deleteExpiredOTP = async () => {
  try {
    const currentTime = new Date();
    console.log('Deleting expired OTPs...');
    await OTP.deleteMany({ expireAt: { $lt: currentTime } });
    console.log('Expired OTPs deleted');
  } catch (error) {
    console.error('Error in deleteExpiredOTP:', error);
    // Handle errors appropriately
  }
};

// Schedule the deleteExpiredOTP function to run every five minutes
setInterval(deleteExpiredOTP, 5 * 60 * 1000);

const sendOTP = async (email) => {
  try {
    if (!email) {
      throw new Error("Provide the email");
    }

    // Delete any existing OTP for the same email
    console.log('Deleting existing OTP...');
    await OTP.deleteOne({ email });

    // Generate OTP
    console.log('Generating OTP...');
    const generatedOTP = await generateOTP();
    console.log(generatedOTP);

    // Set expiration time for OTP (5 minutes from now)
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    // Send email with OTP
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
    await mail(mailOptions);
    console.log('Email sent');

    // Save OTP with expiration time
    const newOtp = await new OTP({
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
    // Handle errors appropriately
    throw error;
  }
};

module.exports = { sendOTP };
