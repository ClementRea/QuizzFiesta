const app = require('./app');
const connectToMongo = require('../config/database');

connectToMongo()

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});