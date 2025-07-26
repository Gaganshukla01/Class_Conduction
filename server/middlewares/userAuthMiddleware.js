import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    const {token}=req.cookies;
    
    console.log('Received cookies:', req.cookies)
console.log('Auth header:', req.headers.authorization)
    // TEMPORARY - just for testing
const testSecret = process.env.JWT_SECRET || 'your-local-jwt-secret-here'
const decoded = jwt.verify(token, testSecret)

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if (tokenDecode.id) {
            req.body.userId = tokenDecode.id; 
        } else {
            return res.status(401).json({ success: false, message: "Not Authorized. Please log in again." });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token." });
    }
};

export default userAuth;
