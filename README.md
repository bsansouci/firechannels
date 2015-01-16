# firechannels
Core.async channels implemented over Firebase

You can do things like:
```js
var c = chan();
var c2 = chan();
c2.get(function(v){
  console.log("got value", v);
});
c.get(function(cc2){
  cc2.put("some random thing");
});
c.put(c2);
```