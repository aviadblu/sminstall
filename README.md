# sminstall
npm install for build machine, make it much faster using cache mechanism 
# Installation

Either through cloning with git or by using [npm](http://npmjs.org) (the recommended way):

```bash
npm install -g sminstall
```

# Usage

sminstall install the same as 'npm install' command:

```bash
sminstall [path to root npm folder | empty for .]
```

By default, sminstall will only install dependencies (without 'devDependencies'). In some cases you will want to install 'devDependencies'.

This can be done via the command line:

```bash
sminstall [path to root npm folder | empty for .] --dev
```

# Clean sminstall cache
```bash
sminstall [path to root npm folder | empty for .] --clean
```
