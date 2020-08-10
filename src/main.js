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
const writeGitignore = promisify(gitignore.writeFile);

async function copyEslintFile(options) {
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

async function installDependencies(options) {
  const result = await execa('npm', ['i', ...options.dependencies], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to create package.json'));
  }
  return;
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
  };

  const eslintDirectory = path
    .resolve(
      new URL(import.meta.url).pathname,
      '../../templates/eslint',
      options.eslint.toLowerCase(),
    )
    .replace(/C:\\C:/g, 'C:');
  options.eslintDirectory = eslintDirectory;

  try {
    await access(eslintDirectory, fs.constants.R_OK);
  } catch (err) {
    console.log(eslintDirectory);
    console.error('%s Invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
  }

  const listrTasks = [
    {
      title: 'Create package.json',
      task: () => createPackageJSON(options),
    },
    {
      title: `Install dependenc${
        options.dependencies.length === 1 ? 'y' : 'ies'
      } ${options.dependencies.map(a => `"${a}"`).join(', ')}`,
      task: () => installDependencies(options),
    },
    {
      title: 'Create gitignore',
      task: () => createGitignore(options),
    },
    {
      title: 'Create .eslintrc.js',
      task: () => copyEslintFile(options),
    },
  ];

  if (options.dependencies.indexOf('dotenv') !== -1)
    listrTasks.push({
      title: 'Create .env',
      task: () => createFile('.env', options),
    });

  const tasks = new Listr(listrTasks, {
    exitOnError: false,
  });

  await tasks.run();
  console.log('%s Project ready', chalk.green.bold('DONE'));
  return true;
}
