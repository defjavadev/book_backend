const express = require('express');
const jwt = require("jsonwebtoken");
const { default: axios } = require("axios");

const { bookModel } = require("../Models/bookModel");
const { reviewModel } = require("../Models/reviews");
const { authorMiddleware } = require("../Middlewares/authorMiddleware");
require("dotenv").config();

const bookRouter = express.Router();

//To Add New Book in DB, title & genre & description & price & pages & imageLink need as a req.body & token need as a headers authorization
bookRouter.post("/add", authorMiddleware, async (req, res) => {
  try {
    console.log("Request body before adding:", req.body); // Логируем тело запроса перед добавлением
    const published = new Date().getFullYear();
    req.body = { ...req.body, likes: [], published };
    let books = new bookModel(req.body);
    await books.save();
    console.log("Book added successfully:", books); // Логируем добавленную книгу
    res.send({ msg: "Book Added Successfully", books });
  } catch (error) {
    console.error("Error adding book:", error); // Логируем ошибку
    res.status(500).send({ msg: "Internal Server Error!!" });
  }
});

//To Update Book, bookId need as a id in params & req.body & token need as a headers authorization
bookRouter.patch("/update/:id", authorMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    let book = await bookModel.findByIdAndUpdate(
      { _id: id, author_id: req.body.author_id },
      req.body
    );
    res.send({ msg: "Book Updated Successfully", book });
  } catch (error) {
    res.status(500).send({ msg: "Internal Server Error!!", add: 123 });
  }
});

//To do like or unlike a book, bookId need as a id in params & token need as a headers authorization
bookRouter.post("/:id/like", async (req, res) => {
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
            let book = await bookModel.findByIdAndUpdate(
              { _id: id },
              { likes: arr }
            );
            res.send({ msg: "You unliked the book." });
          } else {
            arr.push(decoded._id);
            let book = await bookModel.findByIdAndUpdate(
              { _id: id },
              { likes: arr }
            );
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
});

//To Delete the book, bookId need as a id in params & token need as a headers authorization
bookRouter.delete("/delete/:id", authorMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    let book = await bookModel.findByIdAndDelete({
      _id: id,
      author_id: req.body.author_id,
    });
    res.send({ msg: "Book Deleted Successfully", book });
  } catch (error) {
    res.status(500).send({ msg: "Internal Server Error!!", add: 123 });
  }
});

//To get all book nothing needs, To filter you can pass (page & limit) || genre || title || author_name as a query
bookRouter.get("", async (req, res) => {
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
      console.log(genre);
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
});

//To get specific author's published book, Login as a author and pass the token as a headers authorization
bookRouter.get("/get", authorMiddleware, async (req, res) => {
  try {
    let books = await bookModel.find({ author_id: req.body.author_id });
    res.send({ msg: "Getting Book Successfully", books });
  } catch (error) {
    res.status(500).send({ msg: "Internal Server Error!!" });
  }
});

//To get a single book by ID
bookRouter.get("/:id", async (req, res) => {
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
});

//To get reviews for a specific book
bookRouter.get("/review/get/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const reviews = await reviewModel.find({ book_id: id });
    res.send({ msg: "Reviews fetched successfully", review: reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send({ msg: "Internal Server Error!!" });
  }
});

//To add a new review
bookRouter.post("/review/add/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const newReview = new reviewModel({
      book_id: id,
      comments: [{
        comment: req.body.comment,
        username: req.body.username,
        published: req.body.published
      }]
    });
    await newReview.save();
    res.send({ msg: "Review added successfully", review: newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).send({ msg: "Internal Server Error!!" });
  }
});

//To reply to a review
bookRouter.patch("/review/reply/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const review = await reviewModel.findById(id);
    if (!review) {
      return res.status(404).send({ msg: "Review not found" });
    }
    
    review.comments.push({
      comment: req.body.comment,
      username: req.body.username,
      published: req.body.published
    });
    
    await review.save();
    res.send({ msg: "Reply added successfully", review });
  } catch (error) {
    console.error("Error replying to review:", error);
    res.status(500).send({ msg: "Internal Server Error!!" });
  }
});

//To get all books by author ID
bookRouter.get("/author/:authorId", async (req, res) => {
  const { authorId } = req.params;
  const token = req.headers?.authorization?.split(" ")[1];
  
  try {
    jwt.verify(token, process.env.SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).send({ msg: "You are not authorized, Please Login" });
      }
      
      const books = await bookModel.find({ author_id: authorId })
        .sort({ createdAt: -1 }); // Sort by newest first
      
      if (!books || books.length === 0) {
        return res.status(404).send({ msg: "No books found for this author" });
      }
      
      res.send({ 
        msg: "Books retrieved successfully", 
        books,
        count: books.length 
      });
    });
  } catch (error) {
    console.error("Error fetching author books:", error);
    res.status(500).send({ msg: "Internal Server Error!!" });
  }
});

module.exports = { bookRouter };
