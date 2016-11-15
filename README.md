# `babel-html`

```
Usage:  -s <src-dir> -d <dest-dir>

Options:
  -h, --help       Show help                                           [boolean]
  -s, --src-dir    Source dir                                [string] [required]
  -d, --dest-dir   Destination dir                           [string] [required]
  -w, --watch      Watch for changes                                   [boolean]
  -D, --copy-files Copy non-compilable files                           [boolean]
```

This will compile all scripts (embedded in html or regular js files) in `src-dir` and save the results to `dest-dir`

---

## TODOs

- allow specifying config via command line
- write tests
