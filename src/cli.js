import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main';

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--yes': Boolean,
      '-y': '--yes',
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  return {
    skipPrompts: args['--yes'] || false,
  };
}

async function promptForMissingOptions(options) {
  const defaultEslint = true;
  const defaultDependencies = [
    'dotenv',
    'ejs',
    'esm',
    'express',
    'less-middleware',
  ];
  if (options.skipPrompts) {
    return {
      ...options,
      eslint: options.eslint || defaultEslint,
      dependencies: options.dependencies || defaultDependencies,
    };
  }

  const questions = [];
  if (!options.eslint) {
    questions.push({
      type: 'confirm',
      name: 'eslint',
      message: 'Add eslint file?',
      default: defaultEslint,
    });
  }
  if (!options.dependencies) {
    questions.push({
      type: 'checkbox',
      message: 'Select dependencies',
      name: 'dependencies',
      choices: defaultDependencies.map((name) => {
        return {
          checked: true,
          name,
        };
      }),
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    eslint: options.eslint || answers.eslint,
    dependencies: options.dependencies || answers.dependencies,
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createProject(options);
}

// ...
