# `babel-html`

```
Usage: babel-html -s <src-dir> -d <dest-dir>

Options:
  -s, --src-dir     Source directory                         [string] [required]
  -d, --dest-dir    Destination directory                    [string] [required]
  -D, --copy-files  Copy non-compilable files                          [boolean]
  -w, --watch       Watch mode                                         [boolean]
  -m, --minify      Minify HTML, CSS nad JS                            [boolean]
  -q, --quiet       Disable logging                                    [boolean]
  -h, --help        Show help                                          [boolean]
```

This will compile all scripts (embedded in html or regular js files) in `src-dir` and save the results to `dest-dir`
