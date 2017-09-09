import ExtractTextPlugin from 'extract-text-webpack-plugin'
import { jsConfig, lessConfig } from './webpack.config.base.js'

const minConfig = jsConfig()
minConfig.output.filename = '[name].min.js'

const cssMinConfig = lessConfig()
cssMinConfig.output.filename = '[name].min.css'
cssMinConfig.plugins = [ new ExtractTextPlugin('[name].min.css') ]

export default [minConfig, cssMinConfig]
