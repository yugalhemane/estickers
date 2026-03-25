import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const verifyUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const user = await User.findOne({ email: "test_user_AG_2@example.com" });
        if (user) {
            user.isVerified = true;
            await user.save();
            console.log("User verified manually");
        } else {
            console.log("User not found");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyUser();
