const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  joinCode: {
    type: String,
  },
  logo: {
    type: String,
  },
});

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
