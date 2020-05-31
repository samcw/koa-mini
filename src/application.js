const http = require('http');
const EventEmitter = require('events');
const context = require('./context');
const request = require('./request');
const response = require('./response');
const Stream = require('stream');

class Koa extends EventEmitter {
  constructor() {
    super();

    this.fn;
    this.middlewares = [];//按照顺序存储
    this.context = context;
    this.request = request;
    this.response = response;
  }
  //使用中间件函数
  use(fn) {
    //把回调存进数组中
    this.middlewares.push(fn);
  }
  //简化版compose,运用递归串联中间件函数
  compose(middlewares, ctx) {
    function dispatch(index) {
      if (index === middlewares.length) return Promise.resolve();
      let middleware = middlewares[index];
      //() => dispatch(index + 1)是next所调用的函数
      return Promise.resolve(middleware(ctx, () => dispatch(index + 1)));//一个中间件执行完了之后，从回调中执行下一个函数，保持顺序
    }
    return dispatch(0);
  }
  //创建Koa的ctx
  createContext(req, res) {
    const ctx = Object.create(this.context);
    const request = ctx.request = Object.create(this.request);
    const response = ctx.response = Object.create(this.response);

    //复杂操作
    ctx.req = request.req = response.req = req;
    ctx.res = request.res = response.res = res;
    request.ctx = response.ctx = ctx;
    request.response = response;
    response.request = request;
    return ctx;
  }
  //创建请求处理函数，这里的req和res是node原生的
  handleRequest(req, res) {
    res.statusCode = 404;//默认404
    let ctx = this.createContext(req, res);//创建ctx
    let fn = this.compose(this.middlewares, ctx);
    fn.then(() => {
      if (typeof ctx.body === 'object') {//是对象则按json输出
        res.setHeader('Content-Type', 'application/json;charset=utf8');
        res.end(JSON.stringify(ctx.body));
      } else if (ctx.body instanceof Stream) {//是流
        ctx.body.pipe(res);
      } else if (typeof ctx.body === 'string' || Buffer.isBuffer(ctx.body)) {//是字符串或buffer
        res.setHeader('Content-Type', 'text/htmlcharset=utf8');
        res.end(ctx.body);
      } else {
        res.end('Not Found');
      }
    }).catch(err => {
      this.emit('error', err);
      res.statusCode = 500;
      res.end('server error');
    })
  }
  //建立服务
  listen(...args) {
    let server = http.createServer(this.handleRequest.bind(this));
    server.listen(...args);
  }
}

module.exports = Koa;
