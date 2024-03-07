import express from "express";
import {
  forgot_password,
  generate_otp,
  register_user,
  resend_otp,
  sign_in_user,
  update_password,
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

router.post("/resend_otp", (req, res) => {
  const data = { ...req.body };
  resend_otp(data, (error, response) => {
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

router.post("/forgot_password", (req, res) => {
  const data = { ...req.body };
  forgot_password(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.post("/update_password", (req, res) => {
  const data = { ...req.body };
  update_password(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

export default router;
