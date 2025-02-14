const mongoose = require("mongoose");

const discussionSchema = mongoose.Schema({
    chat:{type:Array, required: true},
    book_id: {type:String, required: true},
    book_title: {type: String,required: true},
    book_author: {type: String, required: true},
    book_image: {type:String, required: true}
},{
    versionKey: false
});


const discussionModel = mongoose.model('discussion',discussionSchema);

module.exports = {discussionModel};