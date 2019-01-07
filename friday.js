const friday = require('commander');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

const files = require('./libs/files');
const inquirer = require('./libs/inquirer');
const github = require('./libs/github');
const repo = require('./libs/repo');

friday
    .command('init')
    .description('Initialize friday')
    .action(() => {
        console.log(
            chalk.yellow(
                figlet.textSync('Friday', { horizontalLayout: 'full' })
            )
        );
    });

friday
    .command('github')
    .description('ask for github credentials')
    .action(async () => {
        let token = github.getStoredGithubToken();
        if (!token) {
            await github.setGithubCredentials();
            token = await github.registerNewToken();
        }
        console.log(token);
    });

friday
    .command('test')
    .description('Create a new repository on github')
    .action(async () => {
        const getGithubToken = async () => {
            // Fetch token from config store
            let token = github.getStoredGithubToken();
            if (token) {
                return token;
            }

            // No token found, use credentials to access Github account
            await setGithubCredentials();

            // register new token
            token = await github.registerNewToken();
            return token;
        }

        try {
            // Retrieve & set Auth token
            const token = await getGithubToken();
            github.githubAuth(token);

            // Create remote repo
            const url = await repo.createRemoteRepo();

            // create gitignore file
            await repo.createGitIgnore();

            // set up local repo and push to remote
            const done = await repo.setupRepo(url);

            if (done) {
                console.log(chalk.green('All done'));
            }
        } catch (error) {
            if (error) {
                switch (error.status) {
                    case 401:
                        console.log(chalk.red('Could\'t log you in. Please provide correct credentials or token.'));
                        break;
                    case 422:
                        console.log(chalk.red('There already exists a remote repository with the same name.'));
                        break;
                    default:
                        console.log(error);
                        break;
                }
            }
        }
    });

friday.parse(process.argv);

if (!friday.args.length) {
    friday.help();
}
