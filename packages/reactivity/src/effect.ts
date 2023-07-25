export let activeEffect = undefined;

/** 清除Effect的收集 
 * @param effect 
 * 问题：当分支切换，不在页面上的属性再次修改的时候，还会执行effect
 * 解决：期望的是每次执行effect的时候都清理一次依赖，重新收集
 */
function cleanupEffect(effect){
  const {deps} = effect;  //deps 里面装的是 各属性 对应的effect
  if(deps.length){
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)  //解除effect，重新依赖收集
    }
    deps.length = 0;
  }
}

class ReactiveEffect{
  // 这里表示在实例上也添加了active属性
  public active = true; //这个effect默认是激活状态
  public parent = null;
  public deps = [];

  // 用户传递的参数也会到this上 this.fn = fn
  constructor(public fn){}

  run(){   //run 就是执行effect
    if(!this.active){ //如果是非激活状态 只需要执行函数，不需要进行依赖收集
      this.fn()
    }

    // 这里就要依赖收集了，核心就是将当前的 effect 和 稍后的渲染属性关联在一起
    try {
      // 每次执行记住父辈的 activeEffect 这是为了处理effect嵌套情况
      this.parent = activeEffect;
      activeEffect = this;
      console.log('clean',this);
      
      // 这里我们需要在执行用户函数之前将收集的内容清空
      cleanupEffect(this)
      return this.fn(); //当调用取值操作的时候，就可以获取到这个全局的 activeEffect 了
    } finally {
      // 执行完毕后把 activeEffect 设置为父辈的
      activeEffect = this.parent
    }
  }
}

// fn() 为什么不直接执行 fn()？是为了创建一个ReactiveEffect来进行扩展fn，为了能够进行依赖收集
export function effect(fn){
  //这里fn可以根据状态变化 重新执行，effect可以嵌套着写
  const _effect = new ReactiveEffect(fn)
  
  _effect.run() //默认执行
}

/**问题：当嵌套情况（组件就是嵌套的effect），try{}finally{} 执行完毕之后，activeEffect 指向null了
 *  解决思路：
 *  1.[e1,e2]栈 是一种思路 
 *  2.这里嵌套执行类似于树形结构  借用parent来记住父辈的 activeEffect 对比栈的方式更好
 */

// effect(()=>{  // parent = null  activeEffect = e1
//   state.name  //name -> e1
//   effect(()=>{ // parent = e1  activeEffect = e2
//     state.age  // age -> e2
//   })

//   effect(()=>{ // parent = e1  activeEffect = e3
//     state.age  // age -> e3
//   })

//   state.address // address 应该指向 e1
// })

// 一个 effect 对应多个属性，一个属性对应多个effect 多对多关系 （vue2 watcher和dep 关系类似）
const targetMap = new WeakMap();   //WeakMap = {对象:Map{name:Set}}
export function track(target,type,key){
  if(!activeEffect) return;
  
  // ------------- 这里所有的步骤 都是为了创建 WeakMap = {对象:Map{name:Set}} 这种格式 ------- 
  let depsMap = targetMap.get(target); 
  if(!depsMap){
    targetMap.set(target,(depsMap = new Map()))
  }
  
  let dep = depsMap.get(key)
  if(!dep){
    depsMap.set(key,(dep = new Set()))
  }

  let shouldTrack = !dep.has(activeEffect) //去重 防止重复添加

  if(shouldTrack){
    dep.add(activeEffect)

    activeEffect.deps.push(dep) // 反向记录
  }

  // 单向指的是 属性记录了 effect，反向记录：应该也让 effect 记录它被哪些属性记录过，这样做得好处是为了可以清理
}


export function trigger(target,type,key,value,oldValue){
  const depsMap = targetMap.get(target)

  if(!depsMap)return; //触发的值没在模板中使用过

  let effects = depsMap.get(key) //找到属性对应的 effect

  // 在执行之前 先拷贝一份执行  不要关联引用
  if(effects){
    effects = new Set(effects)

    effects.forEach(effect=>{ // 设置新值得时候  找到对应的 effects 循环执行
      // 在执行 effect 的时候 又要执行自己，那么我们需要屏蔽 不要无限调用 比如：effect(()=>{ stage.age = Math.random();app.innerHTML = state.name+ '今年' + state.age})
      if(effect !== activeEffect) effect.run()
    })
  }
  

}