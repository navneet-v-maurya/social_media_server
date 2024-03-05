import Users from "../models/postgres/users.js";
import response_structure from "../utils/response.js";
import { create_token } from "../utils/web_tokens.js";

const email_regex = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/;

export const register_user = async (data, cb) => {
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

    const new_user = await Users.create({
      name: data.name,
      email: data.email,
      password: data.password,
      age: data.age,
      gender: data.gender,
    });

    const { password, ...rest } = new_user.dataValues;

    const token = create_token(rest);

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
