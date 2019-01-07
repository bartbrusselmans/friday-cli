const octokit = require('@octokit/rest')();
const Configstore = require('configstore');
const _ = require('lodash');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const chalk = require('chalk');

const pkg = require('../package.json');
const inquirer = require('./inquirer');

const conf = new Configstore(pkg.name);

module.exports = {
    getInstance: () => {
        return octokit;
    },

    githubAuth: (token) => {
        octokit.authenticate({
            type: 'oauth',
            token: token
        });
    },

    getStoredGithubToken: () => {
        return conf.get('github.token');
    },

    setGithubCredentials: async () => {
        const credentials = await inquirer.askGithubCredentials();
        octokit.authenticate(
            _.extend(
                {
                    type: 'basic',
                },
                credentials
            )
        );
    },

    registerNewToken: async () => {
        const status = new Spinner('Authenticating, please wait...');
        status.start();

        try {
            const response = await octokit.oauthAuthorizations.createAuthorization({
                scopes: ['user', 'public_repo', 'repo', 'repo:status'],
                note: 'friday-cli, ...'
            });
            const token = response.data.token;
            if (token) {
                conf.set('github.token', token);
                return token;
            } else {
                throw new Error('Missing Token', 'Github token was not found in the response');
            }
        } catch (error) {
            throw error;
        } finally {
            status.stop();
        }
    },
}
