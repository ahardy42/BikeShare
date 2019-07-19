const path = require('path');

module.exports = {
  entry: './src/javascript.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'public', 'assets', 'javascript')
  }
};