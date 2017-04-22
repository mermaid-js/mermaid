import ExtractTextPlugin from 'extract-text-webpack-plugin'
import { webConfig, nodeConfig, lessConfig } from './webpack.config.base.js'

const config1 = webConfig()
config1.output.filename = '[name].min.js'

const config2 = webConfig()
config2.externals = ['fs', 'd3']
config2.output.filename = '[name].slim.min.js'

const config3 = nodeConfig()
config3.output.filename = '[name].min.js'

const config4 = lessConfig()
config4.output.filename = '[name].min.css'
config4.plugins = [ new ExtractTextPlugin('[name].min.css') ]

export default [config1, config2, config3, config4]
