import courseContactModel from "../model/contactUs.js";

export async function createContactInquiry(req, res) {
  try {
    const { name, email, phone, courseName, message } = req.body;
    const newContact = new courseContactModel({
      name,
      email,
      phone,
      courseName,
      message,
    });

    await newContact.save();

    return res.status(201).json({
      success: true,
      message: "Contact inquiry submitted successfully",
      data: newContact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit inquiry",
      error: error.message,
    });
  }
}

// GET - Get all contact inquiries
export async function getAllContactInquiries(req, res) {
  try {
    const contacts = await courseContactModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
      error: error.message,
    });
  }
}

// GET - Get contact inquiries by status
export async function getContactsByStatus(req, res) {
  try {
    const { status } = req.params;

    const contacts = await courseContactModel
      .find({ status })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
      error: error.message,
    });
  }
}

// GET - Get single contact inquiry by ID
export async function getContactById(req, res) {
  try {
    const { id } = req.params;

    const contact = await courseContactModel.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact inquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiry",
      error: error.message,
    });
  }
}
