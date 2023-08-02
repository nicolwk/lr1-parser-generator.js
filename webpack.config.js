import path from 'path';
import nodeExternals from 'webpack-node-externals';

const __dirname = path.resolve(path.dirname(''));

export default (env, argv) => {
  return {
    target: ['node16', 'es2020'],
    externals: [nodeExternals({
      modulesFromFile: true,
      importType: 'module'
    })],
    externalsPresets: {
      node: true // in order to ignore built-in modules like path, fs, etc. 
    },
    entry: [ './src/index.ts'],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        }
      ],
    },
    resolve: {
      symlinks: false,
      extensions: ['.tsx', '.ts', '.js'],
    },
    experiments: {
      outputModule: true
    },
    output: {
      module: true,
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'module'
    },
    watch: argv.mode === 'development'
  };
};