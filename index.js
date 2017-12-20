#!/usr/bin/env node

var path = require('path');
var fis = module.exports = require('fis3');
//先把rake加到插件查找中
fis.require.prefixes.unshift('rake');
fis.require.prefixes.unshift('yoghurt');
fis.cli.name = 'yoghurt';
fis.cli.info = require('./package.json');

//文件过滤设置
fis.set('project.ignore', ['node_modules/!**', 'output/!**', 'fis-conf.js']);

var projectName = fis.get('appName');
//默认设置
fis.set('statics', '/.static');
fis.set('namespace', '');
fis.set('domain', '');

fis.hook('relative');

fis.hook('cmd');

fis
    .match('**', {
        useMap: true,
        useHash: true,
        relative: true,
        release: false
    })
    .match('/static/(**)', {
        isMod: true,
        release: '${statics}/${namespace}/$1',
    })
    .match('(**).tmpl', {
        release: '${statics}/${namespace}/$1',
        rExt: '.js',
        isMod: true,
        parser: [fis.plugin('bdtmpl', {
            LEFT_DELIMITER: '<%',
            RIGHT_DELIMITER: '%>'
        })]
    })
    .match('/**.js', {
        isMod: true,
        optimizer: fis.plugin('uglify-js'),
        useHash: true,
        postprocessor: fis.plugin('cmdwrap')
    })
    .match('/static/lib/(**)', {
        useHash: false,
        useCompile: false,
        useParser: false,
        usePreprocessor: false,
        useStandard: false,
        usePostprocessor: false,
        isMod: false,
        parser: false,
        release: "${statics}/${namespace}/lib/$1",
    })
    //产出到views 供模板使用
    .match('/(manifest.json)', {
        useHash: false,
        release: 'views/$1'
    })
    .match('/(map.json)', {
        useHash: false,
        release: '${statics}/${namespace}/$1'
    })
    .match('::image', {
        useMap: true
    })
    .match('/**.less', {
        parser: [fis.plugin('less-common'), fis.plugin('less')], //启用fis-parser-less插件
        rExt: '.css'
    })
    .match('/**.{css,less}', {
        optimizer: fis.plugin('clean-css'),
        //autoprefixer 前缀处理
        postprocessor: fis.plugin("autoprefixer", {
            "browsers": ['last 2 versions', '> 5%', 'ie 8'],
            "flexboxfixer": true,
            "gradientfixer": true
        })
    })
    //widget处理
    .match('/(widget/**)', {
        release: '${statics}/${namespace}/$1',
        isMod: true
    })
    .match('/(widget/ui/(components/**))', {
        id: '$2',
        release: '${statics}/${namespace}/$1',
        isMod: true
    })
    .match('/(widget/**.html)', {
        useHash: false,
        useMap: false,
        release: 'views/$1'
    })
    .match('/(views/(**.html))', {
        useHash: false,
        useMap: false,
        release: 'views/$2'
    })
;

fis.match('::packager', {
    postpackager: fis.plugin('seajs')
});


/*打包 todo
 fis.match('::packager', {
 packager: fis.plugin('de
 ck', {
 useSourceMap: true,
 //https://www.npmjs.com/package/fis3-packager-deps-pack
 'src/pkg/vendors.js': [
 'src/js/vendors/jquery.js',
 'src/js/vendors/moment.js'
 //  'src/js/vendors/!**.js'
 ],

 // 也可以从将 js 依赖中 css 命中。
 'src/pkg/app.css': [
 // main.js 的所有同步依赖加入队列
 'src/css/bootstrap.css',
 'src/css/bootstrap-datetimepicker.css',
 'src/css/font-awesome.css',
 'src/css/custom.css'
 ]

 }),
 postpackager:fis.plugin('seajs')
 });*/


// 注意： fis 中的 sea.js 方案，不支持部分打包。
// 所以不要去配置 packTo 了，运行时会报错的。

//本地测试环境
fis.media('debug').match('/**', {
    useHash: false,
    useSprite: false,
    optimizer: null,
    domain: '${domain}',
    deploy: [deploy]
});

//dev环境 不压缩
fis.media('dev')
    .match('/**', {
        optimizer: null,
        domain: '${domain}',
        deploy: [deploy]
    });

//prod环境 开启压缩
fis.media('prod')
    .match('/**', {
        domain: '${domain}',
        deploy: [deploy]
    });

/**
 * 静态资源产出
 * @param options
 * @param modified
 * @param total
 * @param next
 */
function deploy(options, modified, total, next) {
    /*
     fis.plugin('local-deliver', {
     to: '../'
     })
     */
    var plugin = fis.require('deploy-local-deliver');
    //var releasePath = path.join(fis.get('utopiaAppDir'), 'app/public/.static/');
    var releasePath = getReleasePath();
    options.to = releasePath;
    plugin.apply(null, arguments);
}

function getReleasePath() {
    return path.join(fis.get('appDir'), 'node_modules/.webroot/');
}