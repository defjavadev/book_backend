const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
    comments:{type:Array, required: true},
    book_id: {type:String, required: true}
},{
    versionKey: false
});


const reviewModel = mongoose.model('review',reviewSchema);

module.exports = {reviewModel};