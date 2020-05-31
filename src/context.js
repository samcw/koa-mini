const proto = {}

//这里相当于，给proto绑定2个属性，当读取这2个属性时，会触发相应的函数，函数会返回值
function defineGetter(prop, name) {
  proto.__defineGetter__(name, function() {
    return this[prop][name];
  })
}
function defineSetter(prop, name) {
  proto.__defineSetter__(name, function(val) {
    this[prop][name] = val;
  })
}
//也就是读取proto.url时会返回proto.request.url，当然，正式使用中ctx继承了proto
defineGetter('request', 'url');
defineGetter('request', 'path');
defineGetter('response', 'body');
defineSetter('response', 'body');

module.exports = proto;
