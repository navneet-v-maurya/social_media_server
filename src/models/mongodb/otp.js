import mongoose from "mongoose";

const schema = mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  is_used: {
    type: Boolean,
    default: false,
  },
  token: {
    type: String,
  },
  otp_count: {
    type: Number,
    default: 1,
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 1800,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Otp = mongoose.model("Otp", schema);

export default Otp;
