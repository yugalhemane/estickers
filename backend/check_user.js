import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const user = await User.findOne({ email: "test_user_AG_2@example.com" });
        if (user) {
            console.log("User found:", {
                email: user.email,
                hasPassword: !!user.password,
                isVerified: user.isVerified,
                role: user.role
            });
        } else {
            console.log("User not found");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
