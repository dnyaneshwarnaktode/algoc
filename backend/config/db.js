const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Uses connection string from environment variables
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error(`💡 Make sure MongoDB is running on your system`);
        console.error(`   Install MongoDB: https://www.mongodb.com/try/download/community`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
