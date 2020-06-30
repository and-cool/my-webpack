const { getAst, getCode, getDependcies } = require('./parser')
const path = require('path')
const fs = require("fs")
module.exports = class Complier{
  constructor(options) {
    const { entry, output } = options;
    this.entry = entry;
    this.output = output;
    this.moduleInfo = [];
  }
  run() {
    // 拿到参数，执行，分析入口文件index.js
    const info = this.build(this.entry);
    this.moduleInfo.push(info)
    for(let i = 0; i < this.moduleInfo.length; i++) {
      const item = this.moduleInfo[i]
      const { dependcies } = item
      for(let file in dependcies) {
        this.moduleInfo.push(this.build(dependcies[file]))
      }
    }
    // 格式转换，数组转对象
    const obj = {}
    this.moduleInfo.forEach(item => {
      obj[item.filename] = {
        dependcies: item.dependcies,
        code: item.code
      }
    })
    // 生成构建代码文件
    this.file(obj)
  }
  // 分析入口文件
  build(filename) {
    const ast = getAst(filename)
    const dependcies = getDependcies(ast, filename)
    const code = getCode(ast)
    return {
      filename, dependcies, code
    }
  }
  // 文件生成
  file(code) {
    // 拿到生成文件路径
    const filePath = path.join(this.output.path, this.output.filename);
    console.log(filePath);
    const newCode = JSON.stringify(code);
    const bundle = `(function(graph){
      function require(module) {
        // 根据路径拿到对应的代码， eval一下
        function localRequire(relativePath) {
          // 处理好的路径，在项目中的路径
          return require(graph[module].dependcies[relativePath])
        }
        var exports = {}
        function resolveCode(require, exports, code){
          eval(code);
        }
        resolveCode(localRequire, exports, graph[module].code)
        return exports;
      }
      require('${this.entry}')

    })(${newCode})`
    // 生成文件
    fs.writeFileSync(filePath, bundle, "utf-8")
  }
}