const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { userModel } = require('../Models/userModel')
const { sessionAuth } = require('../Middlewares/sessionAuth')
require('dotenv').config()

const userRouter = express.Router()

//For Username Availablity Check, username need as a req.body;
userRouter.post('/usernamecheck', async (req, res) => {
	try {
		const { username } = req.body
		const user = await userModel.findOne({
			username: { $regex: new RegExp(`^${username}$`, 'i') },
		})
		if (user) {
			res.send({
				msg: 'This username is already taken by Others',
				available: false,
			})
		} else {
			res.send({ msg: 'This username is available', available: true })
		}
	} catch (error) {
		res.status(500).send({ msg: 'Internal Server Error!!' })
	}
})

//For getting All Registered user
userRouter.get('', async (req, res) => {
	try {
		let users = await userModel.find()
		res.send({ msg: 'users getting successfully', users })
	} catch (error) {
		res.status(500).send({ msg: 'Internal Server Error!!' })
	}
})

//For getting Single User, id need as a params & token needs as a headers authorization
userRouter.get('/user/:id', sessionAuth, async (req, res) => {
	const { id } = req.params
	try {
		let user = await userModel.findOne({ _id: id })
		res.send({ msg: 'user getting successfully', user })
	} catch (error) {
		res.status(500).send({ msg: 'Internal Server Error!!' })
	}
})

//To Register User, username & name & email & password need as a req.body
userRouter.post('/signup', async (req, res) => {
	const { username, name, email, password } = req.body
	try {
		let userCheck = await userModel.findOne({ email })
		if (userCheck) {
			res.status(400).send({ msg: 'Email already Registered!!' })
		} else {
			const created =
				new Date().toLocaleDateString('en-US', {
					weekday: 'short',
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				}) +
				' ' +
				new Date().toLocaleTimeString('en-US')
			bcrypt.hash(password, 5, async (err, hash) => {
				if (err) {
					res.status(400).send({ msg: 'Something went wrong, Try again.' })
				} else {
					let user = new userModel({
						username,
						name,
						email,
						password: hash,
						created,
						purchased: [],
						cart: [],
					})
					await user.save()
					res.status(201).send({ msg: 'User Registered Successfull.' })
				}
			})
		}
	} catch (error) {
		res.status(500).send({ msg: 'Internal Server Error!!' })
	}
})

//To Login User, identifier(username || email) & password need as a req.body
userRouter.post('/login', async (req, res) => {
    const { identifier, password } = req.body

    try {
        // Find user by username or email
        const user = await userModel.findOne({
            $or: [
                { username: { $regex: new RegExp(`^${identifier}$`, 'i') } },
                { email: { $regex: new RegExp(`^${identifier}$`, 'i') } }
            ]
        });

        if (!user) {
            return res.status(400).send({ msg: 'User not found!!' });
        }

        // Compare password
        bcrypt.compare(password, user.password, async (err, result) => {
            if (err || !result) {
                return res.status(400).send({ msg: 'Wrong Password!!' });
            }

            // Generate new session ID
            const sessionId = jwt.sign({ time: Date.now() }, process.env.SECRET);

            // Generate token with session ID
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    username: user.username,
                    sessionId: sessionId 
                }, 
                process.env.SECRET, 
                { expiresIn: '7d' }
            );

            // Update user's session ID in database
            await userModel.findByIdAndUpdate(user._id, { sessionId });

            res.send({ 
                msg: 'Login Successful!!', 
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    created: user.created,
                    purchased: user.purchased,
                    cart: user.cart,
                    image: user.image
                }
            });
        });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
})

//To Update Profile, user's id need as a params & token need as a headers authorization & req.body to update
userRouter.patch('/update/:id', sessionAuth, async (req, res) => {
	const { id } = req.params
	try {
		let user = await userModel.findByIdAndUpdate({ _id: id }, req.body)
		res.send({ msg: 'Profile Updated Successfully!!' })
	} catch (error) {
		res.status(500).send({ msg: 'Internal Server Error!!' })
	}
})

//To Delete Account, user's id need as a params & token need as a headers authorization
userRouter.delete('/delete/:id', sessionAuth, async (req, res) => {
	const { id } = req.params
	try {
		let author = await userModel.findByIdAndDelete({ _id: id })
		res.send({ msg: 'Account Deleted Successfully!!' })
	} catch (error) {
		res.status(500).send({ msg: 'Internal Server Error!!' })
	}
})

//For getting user's cart, id need as a params
userRouter.get('/cart/:id', async (req, res) => {
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
  });

// Add logout route
userRouter.post('/logout', sessionAuth, async (req, res) => {
    try {
        // Clear session ID from database
        await userModel.findByIdAndUpdate(req.user.userId, { sessionId: null });
        res.send({ msg: 'Logout successful' });
    } catch (error) {
        res.status(500).send({ msg: 'Internal Server Error!!' });
    }
});

//For verifying token validity
userRouter.get('/verify-token', sessionAuth, async (req, res) => {
    try {
        // If we get here, it means the token is valid (sessionAuth middleware passed)
        res.status(200).send({ msg: 'Token is valid' });
    } catch (error) {
        res.status(401).send({ msg: 'Invalid token' });
    }
});

module.exports = { userRouter }
