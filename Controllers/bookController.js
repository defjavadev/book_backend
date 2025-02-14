const jwt = require('jsonwebtoken');
const axios = require('axios');
const { bookModel } = require('../Models/bookModel');
require('dotenv').config();

const addBook = async (req, res) => {
    try {
        console.log("Request body before adding:", req.body);
        const published = new Date().getFullYear();
        req.body = { ...req.body, likes: [], published };
        let books = new bookModel(req.body);
        await books.save();
        console.log("Book added successfully:", books);
        res.send({ msg: "Book Added Successfully", books });
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(500).send({ msg: "Internal Server Error!!" });
    }
};

const updateBook = async (req, res) => {
    const { id } = req.params;
    try {
        let book = await bookModel.findByIdAndUpdate(
            { _id: id, author_id: req.body.author_id },
            req.body
        );
        res.send({ msg: "Book Updated Successfully", book });
    } catch (error) {
        res.status(500).send({ msg: "Internal Server Error!!" });
    }
};

const toggleLike = async (req, res) => {
    const { id } = req.params;
    const token = req.headers?.authorization?.split(" ")[1];
    try {
        jwt.verify(token, process.env.SECRET, async (err, decoded) => {
            if (err) {
                res.status(400).send({ msg: "You are not authorized, Please Login" });
            } else {
                let book = await bookModel.findOne({ _id: id });
                if (book) {
                    let arr = book.likes;
                    if (arr.includes(decoded._id)) {
                        arr = arr.filter((ele) => ele !== decoded._id);
                        await bookModel.findByIdAndUpdate({ _id: id }, { likes: arr });
                        res.send({ msg: "You unliked the book." });
                    } else {
                        arr.push(decoded._id);
                        await bookModel.findByIdAndUpdate({ _id: id }, { likes: arr });
                        res.send({ msg: "You liked the book." });
                    }
                } else {
                    res.status(400).send({ msg: "Book Id is Wrong!!" });
                }
            }
        });
    } catch (error) {
        res.status(500).send({ msg: "Internal Server Error!!" });
    }
};

const deleteBook = async (req, res) => {
    const { id } = req.params;
    try {
        let book = await bookModel.findByIdAndDelete({
            _id: id,
            author_id: req.body.author_id,
        });
        res.send({ msg: "Book Deleted Successfully", book });
    } catch (error) {
        res.status(500).send({ msg: "Internal Server Error!!" });
    }
};

const getBooks = async (req, res) => {
    const { page, limit, genre, title, author_name } = req.query;
    try {
        let query = {};
        let skipping = 0;
        let limits = 0;

        if (page && limit) {
            limits = +limit;
            skipping = (Number(page) - 1) * Number(limit);
        }

        if (genre) {
            query.genre = genre;
        }

        if (title) {
            query.title = { $regex: new RegExp(title, "i") };
        }

        if (author_name) {
            query.author_name = { $regex: new RegExp(author_name, "i") };
        }

        let books = await bookModel.find(query).skip(skipping).limit(limits);
        let total = await bookModel.countDocuments(query);
        res.send({ msg: "Getting Books Successfully", total, books });
    } catch (error) {
        res.status(500).send({ msg: "Internal Server Error!!" });
    }
};

const getAuthorBooks = async (req, res) => {
    try {
        let books = await bookModel.find({ author_id: req.body.author_id });
        res.send({ msg: "Getting Book Successfully", books });
    } catch (error) {
        res.status(500).send({ msg: "Internal Server Error!!" });
    }
};

const getSingleBook = async (req, res) => {
    const { id } = req.params;
    try {
        const book = await bookModel.findById(id);
        if (!book) {
            return res.status(404).send({ msg: "Book not found" });
        }
        res.send({ msg: "Book found successfully", book });
    } catch (error) {
        console.error("Error fetching book:", error);
        res.status(500).send({ msg: "Internal Server Error!!" });
    }
};

module.exports = {
    addBook,
    updateBook,
    toggleLike,
    deleteBook,
    getBooks,
    getAuthorBooks,
    getSingleBook
};
