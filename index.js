#!/usr/bin/env node

const co = require('co')
const glob = require('glob')
const p = require('pify')
const path = require('path')
const cheerio = require('cheerio')
const fs = require('fs')
const babel = require('babel-core')

co(function *() {

  const [, , src, dest] = process.argv
  if (!src) throw Error('Source directory not specified')
  if (!dest) throw Error('Destination directory not specified')

  const files = [
    ...yield p(glob)(src),
    ...yield p(glob)(`${src}/**/*.html`),
  ]
  .map(file => path.relative(src, file))

  for (const f of files) {
    try {
      if ((yield p(fs.stat)(`${src}/${f}`)).isDirectory()) continue
      console.log(`${src}/${f} -> ${dest}/${f}`)
      const opts = new babel.OptionManager().init({filename: `${src}/${f}`})
      const dom = cheerio.load(yield p(fs.readFile)(`${src}/${f}`, 'utf8'))
      console.log(dom.html())
      dom('script').each((i, el) => {
        const input = dom(el).text()
        const [firstLine] = input.match(/^.*\S.*$/m) || [';']
        const [indent] = firstLine.match(/^\s*/)
        const end = input.match(/\s*$/)[0]
        const output = babel.transform(input, opts).code
        dom(el).text(output.replace(/^/gm, indent) + end)
      })
      console.log(dom.html())
    }
    catch (err) {
      console.error(err.message)
    }
  }

})
.catch(err => console.error(err.message))
