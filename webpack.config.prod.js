import ExtractTextPlugin from 'extract-text-webpack-plugin'
import { webConfig, nodeConfig, lessConfig } from './webpack.config.base.js'

const minConfig = webConfig()
minConfig.output.filename = '[name].min.js'

const slimMinConfig = webConfig()
slimMinConfig.externals = ['fs', 'd3']
slimMinConfig.output.filename = '[name].slim.min.js'

const apiMinConfig = nodeConfig()
apiMinConfig.output.filename = '[name].min.js'

const cssMinConfig = lessConfig()
cssMinConfig.output.filename = '[name].min.css'
cssMinConfig.plugins = [ new ExtractTextPlugin('[name].min.css') ]

export default [minConfig, slimMinConfig, apiMinConfig, cssMinConfig]
