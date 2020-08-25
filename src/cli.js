import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main';

const defaults = {
  dependencies: ['dotenv', 'ejs', 'esm', 'express', 'less-middleware'],
  dotenv: true,
  eslint: true,
  gitignore: true,
  type: 'express',
};

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--yes': Boolean,
      '-y': '--yes',
    },
    {
      argv: rawArgs.slice(2),
    },
  );
  return {
    skipPrompts: args['--yes'] || false,
  };
}

async function promptForMissingOptions(options) {
  if (options.skipPrompts) {
    return {
      ...options,
      dependencies: options.dependencies || defaults.dependencies,
      dotenv: options.dotenv || defaults.dotenv,
      eslint: options.eslint || defaults.eslint,
      gitignore: options.gitignore || defaults.gitignore,
      type: options.type || defaults.type,
    };
  }

  const questions = [];

  if (!options.type) {
    questions.push({
      type: 'list',
      name: 'type',
      message: 'Project Type?',
      choices: ['express', 'npm'],
      default: 0,
    });
  }

  if (!options.dotenv) {
    questions.push({
      type: 'confirm',
      name: 'dotenv',
      message: 'Add .env?',
      default: defaults.dotenv,
    });
  }

  if (!options.eslint) {
    questions.push({
      type: 'confirm',
      name: 'eslint',
      message: 'Add .eslint?',
      default: defaults.eslint,
    });
  }

  if (!options.gitignore) {
    questions.push({
      type: 'confirm',
      name: 'gitignore',
      message: 'Add .gitignore?',
      default: defaults.gitignore,
    });
  }

  if (!options.dependencies) {
    questions.push({
      type: 'checkbox',
      name: 'dependencies',
      message: 'Choose Dependencies:',
      choices: defaults.dependencies.map(depencency => {
        return {
          name: depencency,
          checked: true,
        };
      }),
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    ...options,
    dependencies: options.dependencies || answers.dependencies,
    dotenv: options.dotenv || answers.dotenv,
    eslint: options.eslint || answers.eslint,
    gitignore: options.gitignore || answers.gitignore,
    type: options.type || answers.type,
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createProject(options);
}
