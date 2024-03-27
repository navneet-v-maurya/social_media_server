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
      token: token,
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

export const resend_otp = async (data, cb) => {
  try {
    if (!data.token) throw new Error("Data missing");

    const user_details = decode_token(data.token);

    if (!user_details) throw new Error("Invalid token");

    const found_otp = await Otp.findOne({
      email: user_details.email,
      is_used: false,
    }).sort({ updated_at: -1 });

    if (found_otp && found_otp.token !== data.token)
      throw new Error("Invalid token");

    if (found_otp && found_otp.otp_count >= 3)
      throw new Error("Maximum Otp sent!! Please try again after 30 mins");

    const { iat, exp, ...remaining_data } = user_details;
    const new_token = create_token(remaining_data);

    const otp = Math.floor(Math.random() * 1000000).toString();

    const hashed_otp = await encrypt(otp);

    const mailOptions = {
      from: process.env.EMAIL,
      to: user_details.email,
      subject: data.is_password
        ? "OTP Verification for Resetting Password"
        : "OTP Verification",
      text: `Your 6 Digit OTP for email Verification is ${otp}`,
    };

    if (!found_otp) {
      const new_otp = new Otp({
        otp: hashed_otp,
        email: user_details.email,
        token: new_token,
      });

      await Promise.all([transporter.sendMail(mailOptions), new_otp.save()]);
    } else {
      await Promise.all([
        transporter.sendMail(mailOptions),
        Otp.findByIdAndUpdate(found_otp._id, {
          otp: hashed_otp,
          otp_count: found_otp.otp_count + 1,
          token: new_token,
        }),
      ]);
    }

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "generate_otp",
          message: "OTP Resent Successfully",
          data: { new_token },
        })
        .toJS()
    );
  } catch (err) {
    console.log(err);
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "resend_otp",
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

export const forgot_password = async (data, cb) => {
  try {
    if (!data.email) throw new Error("Data missing");

    const found_user = await Users.findOne({
      where: {
        email: data.email,
      },
    });

    if (!found_user) throw new Error("Email not found");

    const token = create_token({
      email: data.email,
    });

    const otp = Math.floor(Math.random() * 1000000).toString();

    const hashed_otp = await encrypt(otp);

    const new_otp = new Otp({
      otp: hashed_otp,
      email: data.email,
      token: token,
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: data.email,
      subject: "OTP Verification for Resetting Password",
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
          action: "forgot_passowrd",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const update_password = async (data, cb) => {
  try {
    if (!data.token || !data.new_password || !data.otp)
      throw new Error("Data missing");

    const user_details = decode_token(data.token);

    if (!user_details) throw new Error("Invalid token");

    const [found_user, found_otp] = await Promise.all([
      Users.findOne({
        where: {
          email: user_details.email,
        },
      }),
      Otp.findOne({
        email: user_details.email,
        is_used: false,
      }).sort({ updated_at: -1 }),
    ]);

    if (!found_user) throw new Error("Email not found");
    if (!found_otp) throw new Error("Otp Not Found");
    if (data.token !== found_otp.token) throw new Error("Invalid token");

    const otp_matched = await compare(data.otp, found_otp.otp);

    if (!otp_matched) throw new Error("Invalid Otp");

    await Promise.all([
      Users.update(
        { password: await encrypt(data.password) },
        {
          where: {
            email: user_details.email,
          },
        }
      ),
      Otp.findByIdAndUpdate(found_otp._id, { is_used: true }),
    ]);

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "update_passowrd",
          message: "Password Updated Successfully",
        })
        .toJS()
    );
  } catch (err) {
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "update_passowrd",
          message: err.message,
        })
        .toJS()
    );
  }
};
