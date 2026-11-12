import userModel from "../model/userModel.js";
import { avatarOf, destroyAsset, validateUploadedFile, ROOT_FOLDER } from "../services/cloudinaryService.js";

export const userData = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ sucess: false, message: "user not found.." });
    }

    return res.json({
      sucess: true,
      message: {
        name: user.name,
        isAccountVerifed: user.isAccountVerified,
        userId: userId,
        userType: user.userType,
        avatarUrl: avatarOf(user, 200),
      },
    });
  } catch (error) {
    return res.json({ sucess: false, message: error.message });
  }
};

export const updateUserTypeAlt = async (req, res) => {
  try {
    const { userId, userType } = req.body;

    if (!userType) {
      return res.json({
        success: false,
        message: "Email and userType are required",
      });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { _id: userId },
      { userType: userType },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User type updated successfully",
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        userType: updatedUser.userType,
        isAccountVerified: updatedUser.isAccountVerified,
      },
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel
      .find()
      .select(
        "-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt"
      );

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// ---- profile photo (stored on Cloudinary; every avatar in the app uses this) ----
export const setAvatar = async (req, res) => {
  try {
    const file = validateUploadedFile(req.body.file, `${ROOT_FOLDER}/avatars/${req.userId}`, "image");
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const old = user.avatar?.publicId;
    user.avatar = { url: file.url, publicId: file.publicId };
    await user.save();
    if (old && old !== file.publicId) destroyAsset(old, "image").catch(() => {});
    res.status(200).json({ success: true, message: "Profile photo updated.", avatarUrl: avatarOf(user, 200) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const old = user.avatar?.publicId;
    user.avatar = undefined;
    await user.save();
    if (old) destroyAsset(old, "image").catch(() => {});
    res.status(200).json({ success: true, message: "Profile photo removed.", avatarUrl: null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not remove the photo." });
  }
};
