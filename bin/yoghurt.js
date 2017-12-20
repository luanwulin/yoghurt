#!/usr/bin/env node

var Liftoff = require('liftoff');
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');
var findUp = require('find-up');

try {
  var pkgName = 'package.json';
  var pkgPath = findUp.sync(pkgName, {cwd: process.cwd()});

  var pkg = require(pkgPath),
   appName = pkg.name,
   appDir = path.dirname(pkgPath);

//todo 做目录兼容
   fisConfigPath = path.join(appDir, 'app/webroot/fis-conf');
} catch (e) {
}


var cli = new Liftoff({
    name: 'yoghurt', // 命令名字
    processTitle: 'yoghurt',
    moduleName: 'yoghurt',
    configName: fisConfigPath,

    // only js supported!
    extensions: {
        '.js': null
    }
});

cli.launch({
    cwd: argv.r || argv.root,
    configPath: argv.f || argv.file
}, function(env) {
    var fis;
    if (!env.modulePath) {
        fis = require('../');
    } else {
        fis = require(env.modulePath);
    }
    // 配置插件查找路径，优先查找本地项目里面的 node_modules
    // 然后才是全局环境下面安装的 fis3 目录里面的 node_modules
    fis.require.paths.unshift(path.join(env.cwd, 'node_modules'));
    fis.require.paths.push(path.join(path.dirname(__dirname), 'node_modules'));
    fis.cli.run(argv, env);
});