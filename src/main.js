import chalk from 'chalk';
import execa from 'execa';
import fs from 'fs';
import gitignore from 'gitignore';
import Listr from 'listr';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';

const copy = promisify(ncp);
const writeGitignore = promisify(gitignore.writeFile);

async function copyEslintFile(options) {
  const directory = path.join(__dirname, '../includes/eslint');
  return copy(directory, options.targetDirectory, { clobber: false });
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
  const obj = {
    name: options.targetDirectory.split(/\\|\//g).slice(-1)[0],
    version: '0.0.1',
    description: '',
    main: 'server/index.js',
    scripts: {
      'build:twcss':
        'tailwindcss build src/lib/tailwindcss/tailwind.css -o src/lib/tailwindcss/tailwind.compiled.css',
      'dev':
        'nodemon' in options.dependencies
          ? 'nodemon server/index.js'
          : 'node server/index.js',
    },
    author: 'Bob McAleavey <bobmcaleavey@gmail.com> (https://bobthered.com)',
    license: 'MIT',
  };

  const json = JSON.stringify(obj);

  try {
    console.log(`${options.targetDirectory}/package.json`);
    await fs.writeFile(
      `${options.targetDirectory}/package.json`,
      json,
      'utf8',
      () => {},
    );
  } catch (error) {
    console.error(error);
  }
  // const result = await execa('npm', ['init', '-y'], {
  //   cwd: options.targetDirectory,
  // });
  // if (result.failed) {
  //   return Promise.reject(new Error('Failed to create package.json'));
  // }
  // return;
}

async function createProjectType(options) {
  const directory = path.join(__dirname, `../templates/${options.type}`);
  return copy(directory, options.targetDirectory, { clobber: false });
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

  // createProjectType(options);
  await tasks.run();
  console.log('%s Project ready', chalk.green.bold('DONE'));
  return true;
}
