#!/usr/bin/env node

const co = require('co')
const p = require('pify')
const path = require('path')
const chokidar = require('chokidar')
const cheerio = require('cheerio')
const fs = require('fs')
const babel = require('babel-core')
const mkdirp = require('mkdirp')
const {minify: htmlMinify} = require('html-minifier')
const o = require('yargs')
  .usage('Usage: $0 -s <src-dir> -d <dest-dir>')
  .option('s', {type: 'string', alias: 'src-dir', demand: true})
  .option('d', {type: 'string', alias: 'dest-dir', demand: true})
  .option('D', {type: 'boolean', alias: 'copy-files'})
  .option('w', {type: 'boolean', alias: 'watch'})
  .option('m', {type: 'boolean', alias: 'minify'})
  .help('h')
  .alias('h', 'help')
  .strict()
  .argv

const printError = err => console.error(err.message)

const transformHtml = co.wrap(function *(src, dest, {minify}) {
  console.log(`${src} -> ${dest}`)
  const dom = yield p(fs.readFile)(src, 'utf8').then(cheerio.load)
  dom('script:not([src])').each((i, el) => {
    const input = dom(el).text()
    const [firstLine] = input.match(/^.*\S.*$/m) || [';']
    const [indent] = firstLine.match(/^\s*/)
    const end = input.match(/\s*$/)[0]
    let output = babel.transform(input, {
      filename: src, compact: !!minify,
      comments: !minify, minified: !!minify,
    }).code
    if (minify) output = output.replace(/^\s+|\s+$/g, '')
    else output = '\n' + output.replace(/^\n/, '').replace(/^/gm, indent) + end
    dom(el).text(output)
  })
  yield p(mkdirp)(path.dirname(dest)).catch(printError)
  let output = dom.html()
  if (minify) output = htmlMinify(output, {
    collapseInlineTagWhitespace: true, collapseWhitespace: true,
    minifyCSS: true,
  })
  yield p(fs.writeFile)(dest, output)
})

const transformJs = co.wrap(function *(src, dest, {minify}) {
  console.log(`${src} -> ${dest}`)
  const output = yield p(babel.transformFile)(src, {
    compact: !!minify, comments: !minify, minified: !!minify,
  }).then(out => out.code)
  yield p(mkdirp)(path.dirname(dest)).catch(printError)
  yield p(fs.writeFile)(dest, output)
})

const copy = co.wrap(function *(src, dest) {
  console.log(`${src} -> ${dest}`)
  yield p(mkdirp)(path.dirname(dest)).catch(printError)
  yield new Promise((resolve, reject) =>
    fs.createReadStream(src)
    .pipe(fs.createWriteStream(dest))
    .on('finish', resolve)
    .on('error', reject)
  )
})

chokidar.watch('.', {cwd: o.s, persistent: o.w})
.on('all', (ev, f) => {
  if (!['add', 'change'].includes(ev)) return
  const [src, dest] = [path.join(o.s, f), path.join(o.d, f)]
  const opt = {minify: !!o.m}
  if (f.match(/\.html?$/)) transformHtml(src, dest, opt).catch(printError)
  else if (f.match(/\.jsx?$/)) transformJs(src, dest, opt).catch(printError)
  else if (o.D) copy(src, dest, opt).catch(printError)
})
