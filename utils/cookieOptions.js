const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
};

module.exports = cookieOptions;