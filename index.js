#!/usr/bin/env node

const co = require('co')
const p = require('pify')
const path = require('path')
const chokidar = require('chokidar')
const cheerio = require('cheerio')
const fs = require('fs')
const babel = require('babel-core')
const o = require('yargs')
  .usage('Usage: $0 -s <src-dir> -d <dest-dir>')
  .option('s', {type: 'string', alias: 'src-dir', demand: true})
  .option('d', {type: 'string', alias: 'dest-dir', demand: true})
  .option('D', {type: 'boolean', alias: 'copy-files'})
  .option('w', {type: 'boolean', alias: 'watch'})
  .help('h')
  .alias('h', 'help')
  .strict()
  .argv

const transform = co.wrap(function *(src, dest) {
  console.log(`${src} -> ${dest}`)
  const opts = new babel.OptionManager().init({filename: src})
  const dom = yield p(fs.readFile)(src, 'utf8').then(cheerio.load)
  dom('script:not([src])').each((i, el) => {
    const input = dom(el).text()
    const [firstLine] = input.match(/^.*\S.*$/m) || [';']
    const [indent] = firstLine.match(/^\s*/)
    const end = input.match(/\s*$/)[0]
    const output = babel.transform(input, opts).code
    dom(el).text('\n' + output.replace(/^\n/, '').replace(/^/gm, indent) + end)
  })
  console.log(dom.html())
})

const copy = () => { /* TODO */ }

chokidar.watch('.', {cwd: o.s, persistent: o.w})
.on('all', (ev, f) => {
  if (!['add', 'change'].includes(ev)) return
  const [src, dest] = [path.join(o.s, f), path.join(o.d, f)]
  if (f.match(/\.html?$/)) transform(src, dest).catch(console.error)
  else if (o.D) copy(src, dest).catch(console.error)
})
