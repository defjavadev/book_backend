const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { userModel } = require('../Models/userModel');
require('dotenv').config();

const checkUsername = async (req, res) => {
    try {
        const { username } = req.body;
        const user = await userModel.findOne({
            username: { $regex: new RegExp(`^${username}$`, 'i') },
        });
        if (user) {
            res.send({
                msg: 'This username is already taken by Others',
                available: false,
            });
        } else {
            res.send({ msg: 'This username is available', available: true });
        }
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        let users = await userModel.find();
        res.send({ msg: 'users getting successfully', users });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

const getUser = async (req, res) => {
    const { id } = req.params;
    try {
        let user = await userModel.findOne({ _id: id });
        res.send({ msg: 'user getting successfully', user });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

const signup = async (req, res) => {
    const { username, name, email, password } = req.body;
    try {
        let userCheck = await userModel.findOne({ email });
        if (userCheck) {
            res.status(400).send({ msg: 'Email already Registered!!' });
        } else {
            const created = new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }) + ' ' + new Date().toLocaleTimeString('en-US');

            bcrypt.hash(password, 5, async (err, hash) => {
                if (err) {
                    res.status(400).send({ msg: 'Something went wrong, Try again.' });
                } else {
                    let user = new userModel({
                        username,
                        name,
                        email,
                        password: hash,
                        created,
                        cart: [],
                        purchased: [],
                    });
                    await user.save();
                    res.status(201).send({ msg: 'User Registered Successfull.' });
                }
            });
        }
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

const login = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        let userCheck = await userModel.findOne({
            $or: [
                { username: { $regex: new RegExp(`^${identifier}$`, 'i') } },
                { email: { $regex: new RegExp(`^${identifier}$`, 'i') } },
            ],
        });

        if (!userCheck) {
            return res.status(400).send({ msg: 'Email or Username is not Registered!!' });
        }

        bcrypt.compare(password, userCheck.password, (err, result) => {
            if (result) {
                const token = jwt.sign(
                    { user_id: userCheck._id, user_name: userCheck.name },
                    process.env.SECRET,
                    { expiresIn: '1h' }
                );
                res.send({
                    msg: 'Login Successfull!!',
                    token,
                    user: {
                        _id: userCheck._id,
                        name: userCheck.name,
                        username: userCheck.username,
                        image: userCheck.image || null
                    }
                });
            } else {
                res.status(400).send({ msg: 'Wrong Credentials!!' });
            }
        });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

const updateProfile = async (req, res) => {
    const { id } = req.params;
    try {
        let user = await userModel.findByIdAndUpdate({ _id: id }, req.body);
        res.send({ msg: 'Profile Updated Successfully!!' });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

const deleteAccount = async (req, res) => {
    const { id } = req.params;
    try {
        let user = await userModel.findByIdAndDelete({ _id: id });
        res.send({ msg: 'Account Deleted Successfully!!' });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

const logout = async (req, res) => {
    try {
        res.send({ msg: 'Logout Successful' });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

const getUserCart = async (req, res) => {
    const { id } = req.params;
    try {
        let user = await userModel.findOne({ _id: id });
        if (!user) {
            return res.status(404).send({ msg: 'User not found' });
        }
        res.send({
            msg: 'Cart retrieved successfully',
            cart: user.cart || []
        });
    } catch (error) {
        console.error('Error retrieving cart:', error);
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
};

module.exports = {
    checkUsername,
    getAllUsers,
    getUser,
    signup,
    login,
    updateProfile,
    deleteAccount,
    logout,
    getUserCart
};
