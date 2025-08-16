const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "CLASSIC",
      "ORDER",
      "ASSOCIATION",
      "MULTIPLE_CHOICE",
      "BLIND_TEST",
      "FIND_INTRUDER",
    ],
    default: "CLASSIC",
  },
  answer: [
    {
      text: {
        type: String,
        required: true,
      },
      isCorrect: {
        type: Boolean,
        required: true,
      },
      correctOrder: {
        type: Number,
        // only if the question type is ORDER
        required: function () {
          return this.parent().parent().type === "order";
        },
      },
    },
  ],
  points: {
    type: Number,
    default: 1,
  },
  timeGiven: {
    type: Number,
    default: 45,
  },
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
