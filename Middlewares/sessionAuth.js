const jwt = require('jsonwebtoken');
const { userModel } = require('../Models/userModel');
require('dotenv').config();

const sessionAuth = async (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).send({ msg: 'No token provided' });
        }

        // Verify token
        jwt.verify(token, process.env.SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).send({ msg: 'Invalid token' });
            }

            // Get user and check session ID
            const user = await userModel.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).send({ msg: 'User not found' });
            }

            // Check if the session ID in token matches the one in database
            if (user.sessionId !== decoded.sessionId) {
                return res.status(401).send({ 
                    msg: 'Session expired. Please login again',
                    sessionExpired: true
                });
            }

            // Add user info to request
            req.user = decoded;
            next();
        });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

module.exports = { sessionAuth };
