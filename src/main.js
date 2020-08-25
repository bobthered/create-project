import chalk from 'chalk';
import execa from 'execa';
import fs from 'fs';
import gitignore from 'gitignore';
import Listr from 'listr';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';

const access = promisify(fs.access);
const copy = promisify(ncp);
// const readFile = promisify(fs.readFile);
const writeGitignore = promisify(gitignore.writeFile);

async function copyEslintFile(options) {
  const eslintDirectory = path
    .resolve(new URL(import.meta.url).pathname, '../../includes/eslint')
    .replace(/C:\\C:/g, 'C:');
  options.eslintDirectory = eslintDirectory;

  try {
    await access(eslintDirectory, fs.constants.R_OK);
  } catch (err) {
    console.log(eslintDirectory);
    console.error('%s Invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
  }

  return copy(options.eslintDirectory, options.targetDirectory, {
    clobber: false,
  });
}

async function createFile(filename, options) {
  fs.createWriteStream(path.join(options.targetDirectory, filename), {
    flags: 'a',
  });
  return;
}

async function createGitignore(options) {
  const file = fs.createWriteStream(
    path.join(options.targetDirectory, '.gitignore'),
    { flags: 'a' },
  );
  return writeGitignore({
    type: 'Node',
    file: file,
  });
}

async function createPackageJSON(options) {
  const result = await execa('npm', ['init', '-y'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to create package.json'));
  }
  return;
}

async function createProjectType(options) {
  const directory = path
    .resolve(
      new URL(import.meta.url).pathname,
      `../../templates/${options.type}`,
    )
    .replace(/C:\\C:/g, 'C:');
  console.log(directory);
  return copy(directory, options.targetDirectory, {
    clobber: false,
  });
}

async function installDependencies(options) {
  const result = await execa('npm', ['i', ...options.dependencies], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to install dependencies'));
  }
  return;
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
  };

  const listrTasks = [];

  listrTasks.push({
    title: 'Create package.json',
    task: () => createPackageJSON(options),
  });

  if (options.dotenv) {
    listrTasks.push({
      title: 'Create .env',
      task: () => createFile('.env', options),
    });
  }

  if (options.eslint) {
    listrTasks.push({
      title: 'Create .eslintrc.js',
      task: () => copyEslintFile(options),
    });
  }

  if (options.gitignore) {
    listrTasks.push({
      title: 'Create .gitignore',
      task: () => createGitignore(options),
    });
  }

  listrTasks.push({
    title: `Create '${options.type}' project`,
    task: () => createProjectType(options),
  });

  if (options.dependencies.length > 0) {
    listrTasks.push({
      title: 'Install dependencies',
      task: () => installDependencies(options),
    });
  }

  const tasks = new Listr(listrTasks, {
    exitOnError: false,
  });

  await tasks.run();
  console.log('%s Project ready', chalk.green.bold('DONE'));
  return true;
}
