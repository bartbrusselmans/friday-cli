const _ = require('lodash');
const fs = require('fs');
const git = require('simple-git')();
const CLI = require('clui');
const Spinner = CLI.Spinner;

const inquirer = require('./inquirer');
const gh = require('./github');

module.exports = {
    createRemoteRepo: async () => {
        const github = gh.getInstance();
        // console.log(github.repos);
        
        const answers = await inquirer.askRepoDetails();

        const data = {
            name: answers.name,
            description: answers.description,
            private: (answers.visibility === 'private')
        };

        const status = new Spinner('Creating remote repository...');
        status.start();

        try {
            const response = await github.repos.createForAuthenticatedUser(data);
            
            return response.data.ssh_url;
        } catch (error) {
            throw error;
        } finally {
            status.stop();
        }
    },
    createGitIgnore: async () => {
        const filelist = _.without(fs.readdirSync('.'), '.git', '.gitignore');        

        if (filelist.length) {
            const answers = await inquirer.askIgnoreFiles(filelist);
            if (answers.ignore.length) {
                fs.writeFileSync('.gitignore', answers.ignore.join('\n'));
            } else {
                touch('.gitignore');
            }
        } else {
            touch('.gitignore');
        }
    },
    setupRepo: async (url) => {
        
        const status = new Spinner('Initializing local repository and pushing to remote...');
        status.start();

        try {
            await git
                .init()
                .add('.gitignore')
                .add('./*')
                .commit('Initial commit')
                .addRemote('origin', url)
                .push('origin', 'master');
            return true;
        } catch (error) {
            throw error;
        } finally {
            status.stop();
        }
    },
}
