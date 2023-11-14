import mongoose from "mongoose";


const connectDB = async () =>{
    // return await mongoose.connect(process.env.DB_URL)
    return await mongoose.connect(process.env.DB_URL_CLOUD)
    .then((res) =>{
        console.log("🚀DB Connected .........")
    }).catch((err) =>{
        console.log("🚀 ~ file: connection.js:6 ~.catch ~ err:", err)
    });
}
export default connectDB;