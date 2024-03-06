import express from "express";
import {
  generate_otp,
  register_user,
  sign_in_user,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/generate_otp", (req, res) => {
  const data = { ...req.body };
  generate_otp(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.post("/register_user", (req, res) => {
  const data = { ...req.body };
  register_user(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.post("/sign_in", (req, res) => {
  const data = { ...req.body };
  sign_in_user(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

export default router;
