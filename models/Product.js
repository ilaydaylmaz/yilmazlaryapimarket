const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: true
  },
  kategori: {
    type: String,
    default: ""
  },
  marka: {
    type: String,
    default: ""
  },
  aciklama: {
    type: String,
    default: ""
  },
  resim: {
    type: String,
    default: ""
  }
}, {
  timestamps: true // createdAt ve updatedAt otomatik eklenir
});

module.exports = mongoose.model("Product", productSchema);

