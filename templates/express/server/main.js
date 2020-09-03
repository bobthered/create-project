import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import lessMiddleware from 'less-middleware';
import loadConfigFile from 'rollup/dist/loadConfigFile';
import path from 'path';
import * as rollup from 'rollup';

// Initiate dotenv
dotenv.config();

const app = express();
const port = process.env.PORT || 5500;

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views/pages'));

// Less Middleware
app.use(
  lessMiddleware(path.join(__dirname, '../public'), {
    debug: true,
    preprocess: {
      path: function (pathname) {
        return pathname.replace(/public/g, 'src').replace(/css/g, 'less');
      },
    },
    render: {
      javascriptEnabled: true,
    },
  }),
);

// Rollup Middleware
loadConfigFile(path.resolve(__dirname, '../rollup.config.js')).then(
  async ({ options, warnings }) => {
    warnings.flush();
    const bundle = await rollup.rollup(options[0]);
    await Promise.all(options[0].output.map(bundle.write));
    const watcher = rollup.watch(options[0]);
    watcher.on('event', event => {
      console.log(`Rollup - ${event.code}`);
    });
  },
);

// Static Middleware
app.use('/', express.static(path.join(__dirname, '../public')));

// body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
