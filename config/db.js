const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {  });
        // await mongoose.connect("mongodb+srv://ashu9908kumar:X3zUEe5EIj1SjVHG@cluster0.7hwh3hb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { });
           
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Database connection failed', error);
        process.exit(1);
    }
};

module.exports = connectDB;
