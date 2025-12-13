const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  adSoyad: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  telefon: {
    type: String,
    required: true
  },
  mesaj: {
    type: String,
    required: true
  }
}, {
  timestamps: true // createdAt ve updatedAt otomatik eklenir
});

module.exports = mongoose.model("Contact", contactSchema);

