const mongoose = require("mongoose");

const QuoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  person: { type: String, required: true },
  category: {
    type: String,
    enum: ["cinematic", "random"],
    default: "random"
  }
});

module.exports = mongoose.model("Quote", QuoteSchema);
