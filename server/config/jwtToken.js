import jwt from "jsonwebtoken"

export const jwtTokenGenrate = (user,res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  
  return res.cookie("token", token, {
    httpOnly: true,

    secure: true,       
    sameSite: "none",

    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
