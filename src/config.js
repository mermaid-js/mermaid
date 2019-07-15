let config = {
  securityLevel: 'strict'
}

export const setConfig = conf => {
  config = conf
}
export const getConfig = () => config
