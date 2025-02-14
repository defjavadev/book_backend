const mongoose = require('mongoose')
require('dotenv').config()

// Функция для подключения к MongoDB
const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			serverSelectionTimeoutMS: 15000, // Увеличенный таймаут
		})
		console.log(`MongoDB Connected: ${mongoose.connection.host}`)
	} catch (error) {
		console.error(`Error connecting to MongoDB: ${error.message}`)
		process.exit(1)
	}
}

// Экспортируем функцию connectDB
module.exports = { connectDB }
