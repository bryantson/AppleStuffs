var mongoose = require("mongoose");

var ProductSchema = mongoose.Schema({
  name: String,
  summary: String,
  pathImgFull: String,
  pathImgThumb: String,
  price: Number,
  description: String
});

mongoose.model("Product", ProductSchema);
