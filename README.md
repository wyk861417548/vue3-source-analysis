├─packages             # 项目源代码包管理
├─scripts              # 打包配置


##### 响应式原理 
###### 核心 effect effect 对应多个属性，一个属性对应多个effect 多对多关系 （vue2 watcher和dep 关系类似）
```
  - 1.先实例化一个new Proxy对象
  - 2.创建effect（核心）默认数据变化要更新，我们先将正在执行的 effect 作为全局变量，渲染（取值），我们在 Proxy 的get方法中进行依赖收集（track + trigger 相当于vue2的 watcher+dep），
  - 3.数据变化，触发属性 set 方法，查找对应的effect集合，找到effect全部执行

```