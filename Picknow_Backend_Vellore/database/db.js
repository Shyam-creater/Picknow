import mongoose from "mongoose";

const connectdb = async () => {
    try {
        // console.log(`----5-----,db------>`, `${process.env.DB}`);
        await mongoose.connect(`${process.env.DB}`);
        console.log("Database connected");
    } catch (error) {
        console.log(error);
        console.log("Database Not Connected");
    }
};

export default connectdb;