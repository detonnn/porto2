const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // source maps tripled the deploy size and are only useful for debugging
  productionSourceMap: false
})
