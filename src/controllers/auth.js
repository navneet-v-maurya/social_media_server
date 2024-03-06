import { decode } from "jsonwebtoken";
import Otp from "../models/mongodb/otp.js";
import Users from "../models/postgres/users.js";
import { transporter } from "../utils/mail_service.js";
import { compare, encrypt } from "../utils/password.js";
import response_structure from "../utils/response.js";
import { create_token, decode_token } from "../utils/web_tokens.js";

const email_regex = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/;

export const generate_otp = async (data, cb) => {
  try {
    if (!data.email || !data.name || !data.password)
      throw new Error("Data missing");

    if (!email_regex.test(data.email)) throw new Error("Invalid email");

    const found = await Users.findOne({
      where: {
        email: data.email,
      },
    });

    if (found) throw new Error("Email alreday exists");

    const token = create_token({
      name: data.name,
      email: data.email,
      password: await encrypt(data.password),
      age: data.age,
      gender: data.gender,
    });

    const otp = Math.floor(Math.random() * 1000000).toString();

    const hashed_otp = await encrypt(otp);

    const new_otp = new Otp({
      otp: hashed_otp,
      email: data.email,
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: data.email,
      subject: "OTP Verification",
      text: `Your 6 Digit OTP for email Verification is ${otp}`,
    };

    await Promise.all([transporter.sendMail(mailOptions), new_otp.save()]);

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "generate_otp",
          message: "OTP sent Successfully",
          data: { token },
        })
        .toJS()
    );
  } catch (err) {
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "generate_otp",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const register_user = async (data, cb) => {
  try {
    if (!data.token || !data.otp) throw new Error("Data missing");

    const user_details = decode_token(data.token);

    if (!user_details) throw new Error("Invalid token");

    const found_otp = await Otp.findOne({
      email: user_details.email,
      is_used: false,
    }).sort({ updated_at: -1 });

    if (!found_otp) throw new Error("No otp found");

    const otp_matched = await compare(data.otp, found_otp.otp);

    if (!otp_matched) throw new Error("Wrong Otp");

    const [new_user, updated_otp] = await Promise.all([
      Users.create({
        name: user_details.name,
        email: user_details.email,
        password: user_details.password,
        age: user_details.age,
        gender: user_details.gender,
      }),
      Otp.findByIdAndUpdate(found_otp._id, { is_used: true }),
    ]);

    const { password, ...rest } = new_user.dataValues;

    const token = create_token({
      _id: rest.id,
      name: rest.name,
      email: rest.email,
      password: rest.password,
      age: rest.age,
      gender: rest.gender,
      phone: rest.phone,
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "resgister_user",
          message: "User registered Successfully",
          data: { ...rest, token },
        })
        .toJS()
    );
  } catch (err) {
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "resgister_user",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const sign_in_user = async (data, cb) => {
  try {
    if (!data.email || !data.password) throw new Error("Data missing");

    const found = await Users.findOne({
      where: { email: data.email },
    });

    if (!found) throw new Error("Email not found");

    const matched = await compare(data.password, found.password);

    if (!matched) throw new Error("Invalid Password");

    const { password, ...rest } = found.dataValues;

    const token = create_token({
      _id: rest.id,
      name: rest.name,
      email: rest.email,
      password: rest.password,
      age: rest.age,
      gender: rest.gender,
      phone: rest.phone,
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "sign_in_user",
          message: "User Logged in Successfully",
          data: { ...rest, token },
        })
        .toJS()
    );
  } catch (err) {
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "sign_in_user",
          message: err.message,
        })
        .toJS()
    );
  }
};
