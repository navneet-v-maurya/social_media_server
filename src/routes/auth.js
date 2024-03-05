import express from "express";
import { register_user } from "../controllers/auth.js";

const router = express.Router();

router.post("/register_user", (req, res) => {
  const data = { ...req.body };
  register_user(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

export default router;
