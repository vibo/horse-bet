import * as path from 'path'
import * as webpack from 'webpack'

export const config: webpack.Configuration = {
  entry: [
    'react-hot-loader/patch',
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/only-dev-server',
    './src/index.tsx'
  ],

  module: {
    rules: [{
        test: /\.tsx?$/,
        loaders: ['react-hot-loader/webpack', 'awesome-typescript-loader']
      }
    ]
  },

  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],

  devServer: {
    hot: true,
    contentBase: './src',
    port: 8080,
    clientLogLevel: 'error',
  }
}

export default config
