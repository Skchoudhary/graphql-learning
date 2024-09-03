const { GraphQLScalarType } = require('graphql')
const { authorizeWithGithub } = require('../lib')
const { ObjectID } = require('mongodb')
const fetch = require('node-fetch')

const resolvers = {
        Query: {
                totalPhotos: (parent, args, { db }) => db.collection('photos')
                        .estimatedDocumentCount(),
                allPhotos: (parent, args, { db }) => db.collection('photos')
                        .find()
                        .toArray(),

                totalUsers: (parent, args, { db }) => db.collection('users')
                        .estiamtedDoucmentCount(),
                allUsers: (parent, args, { db }) =>
                        db.collection('users')
                                .find()
                                .toArray()
        },

        Mutation: {
                postPhoto(parent, args) {
                        var newPhoto = {
                                id: _id++,
                                ...args.input,
                                created: new Date()
                        }
                        photos.push(newPhoto)
                        return newPhoto
                },
                async githubAuth(parent, { code }, { db }) {
                        console.log(`code: ${code}`)
                        let {
                                message,
                                access_token,
                                avatar_url,
                                login,
                                name
                        } = await authorizeWithGithub({
                                client_id:process.env.CLIENT_ID,
                                client_secret: process.env.CLIENT_SECRET,
                                code
                        })
                        
                        console.log(`message: ${message}`)
                        console.log(`access_token: ${access_token}`)
                        console.log(`avatar_url: ${avatar_url}`)
                        console.log(`login: ${login}`)
                        console.log(`name: ${name}`)
                        if (message) {
                                throw new Error(message)
                        }

                        let latestUserInfo = {
                                name,
                                githubLogin: login,
                                githubToken: access_token,
                                avatar: avatar_url
                        }

                        const result = await db
                                .collection('users')
                                .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });

                        let user;
                        if (result.upsertedId) {
                                
                                user = await db.collection('users').findOne({ _id: result.upsertedId._id });
                        } else {
                                
                                user = await db.collection('users').findOne({ githubLogin: login });
                        }

                        console.log(`user: ${user}`)
                        console.log(`access_token: ${access_token}`)
                        return { user, token: access_token }
                }
        },
        Photo: {
                url: parent => `http://random-website.com/img/${parent.id}.jpg`,
                postedBy: parent => {
                        return users.find(u => u.githubLogin == parent.githubUser)
                },
                taggedUsers: parent => tags
                        .filter(tag => tag.photoID === parent.id)
                        .map(tag => tag.userID)
                        .map(userID => users.find(u => u.githubLogin === userID))
        },
        User: {
                postedPhotos: parent => {
                        return photos.filter(p => p.githubUser == parent.githubLogin)
                },
                inPhotos: parent => tags
                        .filter(tag => tag.userID === parent.id)
                        .map(tag => tag.photoID)
                        .map(photoID => photos.find(p => p.id === photoID))
        },
        DateTime: new GraphQLScalarType({
                name: 'DateTime',
                description: 'A valid date time value',
                parseValue: value => new Date(value),
                serialize: value => new Date(value).toISOString(),
                parseLiteral: ast => ast.value
        }),

}

module.exports = resolvers
