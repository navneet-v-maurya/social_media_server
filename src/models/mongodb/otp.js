import mongoose from "mongoose";

const schema = mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  is_used: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now(),
    expires: 300,
  },
  updated_at: {
    type: Date,
    default: Date.now(),
  },
});

const Otp = mongoose.model("Otp", schema);

export default Otp;
