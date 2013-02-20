(function(global) {
    //deferred是整个库最重要的构造，扮演三个角色
    //1 def("Animal")时就是返回deferred,此时我们可以直接接括号对原型进行扩展
    //2 在继承父类时 < 触发两者调用valueOf，此时会执行deferred.valueOf里面的逻辑
    //3 在继承父类时， 父类的后面还可以接括号（废话，此时构造器当普通函数使用），当作传送器，
    //  保存着父类与扩展包到_super,_props
    var deferred;

    function extend(source) {//扩展自定义类的原型
        var prop, target = this.prototype;

        for (var key in source)
            if (source.hasOwnProperty(key)) {
                prop = target[key] = source[key];
                if ('function' == typeof prop) {
                    //在每个原型方法上添加两个自定义属性，保存其名字与当前类
                    prop._name = key;
                    prop._class = this;
                }
            }

        return this;
    }
    // 一个中介者，用于切断子类与父类的原型连接
    //它会像DVD+R光盘那样被反复擦写
    function Subclass() {
    }
    function base() {
        // 取得调用this._super()这个函数本身，如果是在init内，那么就是当前类
        //http://larryzhao.com/blog/arguments-dot-callee-dot-caller-bug-in-internet-explorer-9/
        var caller = base.caller;
        //执行父类的同名方法，有两种形式，一是用户自己传，二是智能取当前函数的参数
        return caller._class._super.prototype[caller._name]
                .apply(this, arguments.length ? arguments : caller.arguments);
    }

    function def(context, klassName) {
        klassName || (klassName = context, context = global);
        //偷偷在给定的全局作用域或某对象上创建一个类
        var Klass = context[klassName] = function Klass() {
            if (context != this) {//如果不使用new 操作符，大多数情况为context与this都为window
                return this.init && this.init.apply(this, arguments);
            }
            //实现继承的第二步，让渡自身与扩展包到deferred
            deferred._super = Klass;
            deferred._props = arguments[0] || {};
        }

        //让所有自定义类都共用同一个extend方法
        Klass.extend = extend;

        //实现继承的第一步，重写deferred，乍一看是刚刚生成的自定义类的扩展函数
        deferred = function(props) {
            return Klass.extend(props);
        };

        // 实现继承的第三步，重写valueOf，方便在def("Dog") < Animal({})执行它
        deferred.valueOf = function() {

            var Superclass = deferred._super;

            if (!Superclass) {
                return Klass;
            }
            // 先将父类的原型赋给中介者，然后再将中介者的实例作为子类的原型
            Subclass.prototype = Superclass.prototype;
            var proto = Klass.prototype = new Subclass;
            // 引用自身与父类
            Klass._class = Klass;
            Klass._super = Superclass;
            //一个小甜点，方便人们知道这个类叫什么名字
            Klass.toString = function() {
                return klassName;
            };
            //强逼原型中的constructor指向自射
            proto.constructor = Klass;
            //让所有自定义类都共用这个base方法，它是构成方法链的关系
            proto._super = base;
            //最后把父类后来传入的扩展包混入子类的原型中
            deferred(deferred._props);
        };

        return deferred;
    }

    global.def = def;
}(this));