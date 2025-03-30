require('dotenv').config();
const { authenticateToken } = require('./middlewares/authenticateToken');
const express = require('express');
const { MongoClient, ObjectId} = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(express.json());

let usersCollection;

client.connect()
    .then(() => {
        const db = client.db('mydatabase');
        app.locals.db = db;
        usersCollection = db.collection('users');
        console.log('Connected to MongoDB');
    })
    .catch(err => console.error('Failed to connect to MongoDB', err));

/* AUTH */ {
    app.post('/api/auth/signup', async (req, res) => {
        const { email, username, password } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ message: 'Email, username, and password are required' });
        }

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            email,
            username,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ message: 'User created', userId: result.insertedId });
    });


app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required' });

    const user = await usersCollection.findOne({ email });
    if (!user)
        return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
        return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token, user });
});
}

/* USER */ {
app.put('/api/user/update', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const usersCollection = db.collection('users');
        const { username, photoURL, password } = req.body;
        const userId = req.user.userId;

        const updateFields = {};
        if (username) updateFields.username = username;
        if (photoURL) updateFields.photoURL = photoURL;
        if (password) {
            updateFields.password = await bcrypt.hash(password, 10);
        }
        updateFields.updatedAt = new Date();

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateFields }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: 'No changes were made' });
        }

        const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get('/api/user/get/:email', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const usersCollection = db.collection('users');
        const { email } = req.params;

        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        delete user.password;

        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user by email:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
}

/* POSTS */ {
app.post('/api/post/create', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const postsCollection = db.collection('posts');

        const { title, content, author } = req.body;
        if (!title || !content || !author) {
            return res.status(400).json({ message: 'Title, content, and author are required' });
        }

        const post = {
            title,
            content,
            author,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await postsCollection.insertOne(post);
        res.status(201).json({ message: 'Post created', postId: result.insertedId });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/post/all', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const postsCollection = db.collection('posts');
        const { ObjectId } = require('mongodb');

        const userId = new ObjectId(req.user.userId);

        const posts = await postsCollection.aggregate([
            {
                $lookup: {
                    from: "favorites",
                    let: { postId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$postId", "$$postId"] },
                                        { $eq: ["$userId", userId] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "favoriteData"
                }
            },
            {
                $addFields: {
                    isFavorite: { $gt: [ { $size: "$favoriteData" }, 0 ] }
                }
            },
            // Lookup the author's data using the email stored in the "author" field.
            {
                $lookup: {
                    from: "users",
                    localField: "author",    // "author" now stores the email address.
                    foreignField: "email",   // Match against the "email" field in users.
                    as: "authorData"
                }
            },
            {
                $unwind: {
                    path: "$authorData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    authorUsername: "$authorData.username"
                }
            },
            {
                $project: { favoriteData: 0, authorData: 0 }
            }
        ])
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/posts/:email', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const postsCollection = db.collection('posts');

        const userEmail = req.params.email;

        const posts = await postsCollection.find({ author: userEmail })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({ posts });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/post/:id', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const postsCollection = db.collection('posts');
        const { ObjectId } = require('mongodb');

        const postId = req.params.id;
        const userId = req.user.userId;
        const userObjectId = new ObjectId(userId);

        const pipeline = [
            { $match: { _id: new ObjectId(postId) } },
            {
                $lookup: {
                    from: "favorites",
                    let: { postId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$postId", "$$postId"] },
                                        { $eq: ["$userId", userObjectId] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "favoriteData"
                }
            },
            {
                $addFields: {
                    isFavorite: { $gt: [ { $size: "$favoriteData" }, 0 ] }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "authorData"
                }
            },
            { $unwind: { path: "$authorData", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    authorUsername: "$authorData.username"
                }
            },
            {
                $project: {
                    favoriteData: 0,
                    authorData: 0
                }
            }
        ];

        const result = await postsCollection.aggregate(pipeline).toArray();
        if (result.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ post: result[0] });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


}

/* COMMENTS */ {
app.post('/api/comment/create', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const commentsCollection = db.collection('comments');

        const { postId, content } = req.body;

        if (!postId || !content) {
            return res.status(400).json({ message: 'Post ID and content are required' });
        }

        const comment = {
            postId: new ObjectId(postId),
            user: req.user.email,
            content,
            createdAt: new Date(),
        };

        const result = await commentsCollection.insertOne(comment);

        res.status(201).json({ message: 'Comment created', commentId: result.insertedId });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/post/:id/comments', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const commentsCollection = db.collection('comments');
        const { ObjectId } = require('mongodb');

        const postId = req.params.id;

        const comments = await commentsCollection
            .find({ postId: new ObjectId(postId) })
            .sort({ createdAt: 1 })
            .toArray();

        res.status(200).json({ comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
}

/* FAVORITES */ {
app.post('/api/favorites/add', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const favoritesCollection = db.collection('favorites');
        const { ObjectId } = require('mongodb');

        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ message: 'Post ID is required' });
        }

        const userId = req.user.userId;

        const existingFavorite = await favoritesCollection.findOne({
            userId: new ObjectId(userId),
            postId: new ObjectId(postId)
        });
        if (existingFavorite) {
            return res.status(400).json({ message: 'Post is already favorited' });
        }

        const favorite = {
            userId: new ObjectId(userId),
            postId: new ObjectId(postId),
            createdAt: new Date()
        };

        const result = await favoritesCollection.insertOne(favorite);
        res.status(201).json({ message: 'Favorite added', favoriteId: result.insertedId });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/favorites/remove', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const favoritesCollection = db.collection('favorites');
        const { ObjectId } = require('mongodb');

        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ message: 'Post ID is required' });
        }

        const userId = req.user.userId;

        const result = await favoritesCollection.deleteOne({
            userId: new ObjectId(userId),
            postId: new ObjectId(postId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        res.status(200).json({ message: 'Favorite removed' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const favoritesCollection = db.collection('favorites');
        const { ObjectId } = require('mongodb');

        const userId = req.user.userId;
        const favorites = await favoritesCollection.find({
            userId: new ObjectId(userId)
        }).toArray();

        res.status(200).json({ favorites });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/favorites/posts', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const favoritesCollection = db.collection('favorites');
        const { ObjectId } = require('mongodb');

        const userId = req.user.userId;

        const favoritePosts = await favoritesCollection.aggregate([
            { $match: { userId: new ObjectId(userId) } },
            {
                $lookup: {
                    from: "posts",
                    localField: "postId",
                    foreignField: "_id",
                    as: "postDetails"
                }
            },
            { $unwind: "$postDetails" },
            { $replaceRoot: { newRoot: "$postDetails" } }
        ]).toArray();

        res.status(200).json({ posts: favoritePosts });
    } catch (error) {
        console.error('Error fetching favorite posts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
}

/* CONVERSATIONS */ {

    app.post('/api/conversations', authenticateToken, async (req, res) => {
        try {
            const db = req.app.locals.db;
            const conversationsCollection = db.collection('conversations');
            const usersCollection = db.collection('users');
            const { ObjectId } = require('mongodb');
            const { participants } = req.body;

            const userId = req.user.userId;
            if (!participants || !Array.isArray(participants)) {
                return res.status(400).json({ message: 'Participants are required' });
            }
            // Ensure the authenticated user is included
            if (!participants.includes(userId)) {
                participants.push(userId);
            }

            const validParticipants = await Promise.all(
                participants.map(async (id) => {
                    if (id instanceof ObjectId) return id;

                    if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
                        return new ObjectId(id);
                    }
                    if (typeof id === 'string') {
                        const userDoc = await usersCollection.findOne({ email: id });
                        if (!userDoc) {
                            throw new Error(`User not found for email: ${id}`);
                        }
                        return userDoc._id;
                    }
                    throw new Error(`Invalid participant identifier: ${id}`);
                })
            );

            const conversation = {
                participants: validParticipants,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastMessage: null
            };

            const result = await conversationsCollection.insertOne(conversation);
            res.status(201).json({ message: 'Conversation created', conversationId: result.insertedId });
        } catch (error) {
            console.error('Error creating conversation:', error);
            res.status(500).json({ message: error.message || 'Internal Server Error' });
        }
    });

    app.get('/api/conversations', authenticateToken, async (req, res) => {
        try {
            const db = req.app.locals.db;
            const conversationsCollection = db.collection('conversations');
            const { ObjectId } = require('mongodb');
            const userId = new ObjectId(req.user.userId);

            const conversations = await conversationsCollection.aggregate([
                { $match: { participants: userId } },
                { $sort: { updatedAt: -1 } },
                {
                    $lookup: {
                        from: "users",
                        let: { participantIds: "$participants" },
                        pipeline: [
                            { $match: { $expr: { $in: ["$_id", "$$participantIds"] } } },
                            { $project: { password: 0 } }
                        ],
                        as: "participantsData"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "lastMessage.sender",
                        foreignField: "_id",
                        as: "lastMessageSender"
                    }
                },
                {
                    $unwind: {
                        path: "$lastMessageSender",
                        preserveNullAndEmptyArrays: true
                    }
                }
            ]).toArray();

            res.status(200).json({ conversations });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });



    app.get('/api/conversations/:id', authenticateToken, async (req, res) => {
        try {
            const db = req.app.locals.db;
            const conversationsCollection = db.collection('conversations');
            const { ObjectId } = require('mongodb');
            const conversationId = req.params.id;

            const pipeline = [
                { $match: { _id: new ObjectId(conversationId) } },
                {
                    $lookup: {
                        from: 'messages',
                        localField: '_id',
                        foreignField: 'conversationId',
                        as: 'messages'
                    }
                },
                {
                    $addFields: {
                        messages: { $sortArray: { input: "$messages", sortBy: { createdAt: -1 } } }
                    }
                }
            ];

            const result = await conversationsCollection.aggregate(pipeline).toArray();
            if (!result || result.length === 0) {
                return res.status(404).json({ message: 'Conversation not found' });
            }
            res.status(200).json({ conversation: result[0] });
        } catch (error) {
            console.error('Error fetching conversation details:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    app.post('/api/messages', authenticateToken, async (req, res) => {
        try {
            const db = req.app.locals.db;
            const messagesCollection = db.collection('messages');
            const conversationsCollection = db.collection('conversations');
            const { ObjectId } = require('mongodb');

            const { conversationId, recipientId, text } = req.body;
            const senderId = req.user.userId;

            let convId = conversationId;

            if (!convId) {
                const existingConv = await conversationsCollection.findOne({
                    participants: { $all: [new ObjectId(senderId), new ObjectId(recipientId)] }
                });
                if (existingConv) {
                    convId = existingConv._id;
                } else {
                    const newConv = {
                        participants: [new ObjectId(senderId), new ObjectId(recipientId)],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        lastMessage: null
                    };
                    const convResult = await conversationsCollection.insertOne(newConv);
                    convId = convResult.insertedId;
                }
            }

            const message = {
                conversationId: new ObjectId(convId),
                sender: new ObjectId(senderId),
                text,
                createdAt: new Date()
            };

            const result = await messagesCollection.insertOne(message);

            await conversationsCollection.updateOne(
                { _id: new ObjectId(convId) },
                { $set: {
                    updatedAt: new Date(),
                    lastMessage: {
                        text,
                        sentAt: new Date(),
                        sender: new ObjectId(senderId)
                    }
                }}
            );

            res.status(201).json({ message: 'Message sent', messageId: result.insertedId, conversationId: convId });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
        try {
            const db = req.app.locals.db;
            const messagesCollection = db.collection('messages');
            const { ObjectId } = require('mongodb');
            const conversationId = req.params.id;

            const messages = await messagesCollection.aggregate([
                { $match: { conversationId: new ObjectId(conversationId) } },
                {
                    $lookup: {
                        from: "users",
                        localField: "sender",
                        foreignField: "_id",
                        as: "senderData"
                    }
                },
                { $unwind: "$senderData" },
                { $sort: { createdAt: -1 } }
            ]).toArray();

            res.status(200).json({ messages });
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });


}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
