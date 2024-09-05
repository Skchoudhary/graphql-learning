const fs = require('fs');
const fetch = require('node-fetch'); // Remove this if using Node.js 18+

const findBy = (value, array, field='id') =>
    array[array.map(item => item[field]).indexOf(value)];

const generateFakeUsers = async (count) => {
    try {
        const res = await fetch(`https://randomuser.me/api/?results=${count}`);
        return await res.json();
    } catch (error) {
        console.error('Error generating fake users:', error);
        throw error;
    }
};

const requestGithubToken = async (credentials) => {
    try {
        const res = await fetch(
            'https://github.com/login/oauth/access_token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(credentials)
            }
        );
        return await res.json();
    } catch (error) {
        console.error('Error requesting GitHub token:', error);
        throw error;
    }
};

const requestGithubUserAccount = async (token) => {
    try {
        const res = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await res.json();
    } catch (error) {
        console.error('Error requesting GitHub user account:', error);
        throw error;
    }
};

const authorizeWithGithub = async (credentials) => {
    try {
        const { access_token } = await requestGithubToken(credentials);
        const githubUser = await requestGithubUserAccount(access_token);
        return { ...githubUser, access_token };
    } catch (error) {
        console.error('Error authorizing with GitHub:', error);
        throw error;
    }
};

const saveFile = (stream, path) => 
    new Promise((resolve, reject) => {
        stream.on('error', error => {
            if (stream.truncated) {
                fs.unlinkSync(path);
            }
            reject(error);
        }).on('end', resolve)
        .pipe(fs.createWriteStream(path));
    });

const uploadFile = async (file, path) => {
    try {
        const { stream } = await file;
        return await saveFile(stream, path);
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

module.exports = { findBy, authorizeWithGithub, generateFakeUsers, uploadFile };
