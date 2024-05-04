// migrate_passwords.js
const bcrypt = require('bcryptjs');
const MongoClient = require('mongodb').MongoClient;

const uri = 'mongodb+srv://erikpyaslane:tfxzxxkd8u@portfolio.4dktmad.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'Portfolio';

const saltRounds = 10;

async function migratePasswords() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();

        const db = client.db(dbName);
        const usersCollection = db.collection('Admins');

        const usersToUpdate = await usersCollection.find({}).toArray();

        for (const user of usersToUpdate) {
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
            await usersCollection.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
        }

        console.log('Passwords migration completed');
    } catch (error) {
        console.error('Error migrating passwords:', error);
    } finally {
        await client.close();
    }
}

migratePasswords();