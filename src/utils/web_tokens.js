import jwt from "jsonwebtoken";

export const create_token = (user) => {
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      phone: user.phone,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return token;
};

export const decode_token = (token) => {
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user;
  } catch (error) {
    throw new Error("Invalid Token");
  }
};
