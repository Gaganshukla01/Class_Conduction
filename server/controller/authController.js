import bcrypt from "bcryptjs";
import { jwtTokenGenrate } from "../config/jwtToken.js";
import userModel from "../model/userModel.js";
import transporter from "../config/nodeMailer.js";
import {
  PASSWORD_RESET_TEMPLATE,
  EMAIL_VERIFY_TEMPLATE,
  USER_REGISTER_TEMPLATE,
} from "../config/emailTemplate.js";

// for regiter new user
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ sucess: false, message: "Missing Details" });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.json({ sucess: false, message: "User Already Found.." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword });

    await user.save();

    // genarting token
    jwtTokenGenrate(user,res);

    // send mail
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welocme to Auth",
      html: USER_REGISTER_TEMPLATE.replace("{{name}}", user.name),
    };

    await transporter.sendMail(mailOption);
    return res.json({ sucess: true, message: "Registered" });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

// googleLogin
export const googleAuth = async (req, res) => {
  try {
    const { name, email, Validuser } = req.body;
    if (!name || !email || !Validuser) {
      return res.json({ sucess: false, message: "Cred not fetched" });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      if (Validuser) {
        // genarting token
        jwtTokenGenrate(existingUser,res);

        return res.json({ sucess: true, message: "Login Successfull" });
      } else {
        return res.json({ sucess: false, message: "User not valid" });
      }
    }

    const password =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({ name, email, password: hashedPassword });
    await newUser.save();

    // genarting token
    jwtTokenGenrate(newUser,res);

    // send mail
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welocme to Auth",
      html: USER_REGISTER_TEMPLATE.replace("{{name}}", newUser.name),
    };

    await transporter.sendMail(mailOption);
    return res.json({sucess:true,message:"User Created."})
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

// for login user
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ sucess: false, message: "Fill email and password.." });
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.json({ sucess: false, message: "email is  not valid." });
  }

  const isMatched = await bcrypt.compare(password, user.password);

  if (!isMatched) {
    return res.json({ sucess: false, message: "Invalid password" });
  }

  // genarting token
  jwtTokenGenrate(user,res);

  return res.json({ sucess: true, message: "Login Sucessfull" });
};

// for logout user
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
  } catch (error) {
    return res.json({ sucess: false, message: "Error" });
  }
  return res.json({ sucess: true, message: "LoggedOut" });
};

// sending otp to mail
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      return res.json({
        success: true,
        message: "Account is already verified",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    user.save();

    // send otp to mail
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Your Verification OTP",
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };

    await transporter.sendMail(mailOption);
    return res.json({ sucess: true, message: "OTP SENDED" });
  } catch (error) {
    return res.json({ success: false, message: "error" });
  }
};

// take otp from user and verify that
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing Deatils" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User Not Found!!" });
    }

    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired.." });
    }
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();
    return res.json({ success: true, message: "Account is verified.." });
  } catch (error) {
    return res.json({ success: false, message: "error" });
  }
};

// user is verified or not ..
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ sucess: true, message: "User is Autheticated" });
  } catch (error) {
    return res.json({
      sucess: false,
      message: "Login Again User is not authenticated.",
    });
  }
};

// resetPassword otp sending
export const resetPasswordOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Email required." });
  }

  try {
    const user = await userModel.findOne({ email: email });

    if (!user) {
      return res.json({ sucess: false, message: "user not found" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    // send otp to mail
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Your Password Reset  OTP",
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email
      ),
    };

    await transporter.sendMail(mailOption);
    return res.json({
      sucess: true,
      message: "OTP sended to your registered mail id",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
// Reset User Password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({ sucess: false, message: "Empty Field is not allowed" });
  }
  try {
    const user = await userModel.findOne({ email: email });
    if (user.resetOtp === "" || user.resetOtp != otp) {
      console.log(user.resetOtp);
      return res.json({ sucess: false, message: "Otp does not match" });
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ sucess: false, message: "Otp expired" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;

    user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Your Password Changed Sucesfully",
      text: `Password Reset Sucessfully for emailId:${email}`,
    };

    await transporter.sendMail(mailOption);
    return res.json({ sucess: true, message: "Password Changed Sucesfully." });
  } catch (error) {
    return res.json({ sucess: false, message: "Error Occured" });
  }
};
