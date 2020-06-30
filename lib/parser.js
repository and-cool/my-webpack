const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { transformFromAst } = require('@babel/core')

module.exports = {
  getAst: (filename) => {
    const content = fs.readFileSync(filename, "utf-8");
    // 获取入口文件引入的依赖
    return parser.parse(content, {
      sourceType: "module"
    })
  },
  getDependcies: (ast, filename) => {
    const dependcies = {};
    // 解析抽象语法树,获取入口模块的依赖内容
    traverse(ast, {
      ImportDeclaration({ node }) {
        const newPath = './' + path.join(path.dirname(filename), node.source.value);
        dependcies[node.source.value] = newPath
      }
    })
    return dependcies
  },
  getCode: (ast) => {
    // 把ast语法树转换成合适的代码
    const { code } = transformFromAst(ast, null, {
      presets: ['@babel/preset-env']
    })
    return code
  }
}