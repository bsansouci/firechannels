var chan = (function() {
  // Helper functions
  var identity = function(a) {
    return a;
  };

  var not = function(x) {
    return !x;
  };


  var firebase = new Firebase("https://<your firebase url>.firebaseio.com/csp");


  var __channelBuilder = function(channelName) {
    var allListeners = new LinkedList();
    var local = firebase.child(channelName);

    local.on("value", function(currentSnapshot) {
      var cur = allListeners.head;
      var val = currentSnapshot.val();
      // We iterate through the linkedlist and stop at the first interested
      // function. Calling it will change the database which will fire the
      // "value" event and therefore call this function again
      while(cur && cur.value) {
        var v = cur.value;
        if(v.isInteresting(val)) {
          allListeners.remove(v);
          v.func.apply(null, v.args);
          break;
        }
        cur = cur.next;
      }
    });

    // Helper function to delay the execution of a command until it's available
    var __delay = function(func, isInteresting) {
      var args = Array.prototype.slice.call(arguments, 2);
      allListeners.add({
        isInteresting: isInteresting,
        func: func,
        args: args
      });
    };

    var lastPutTime = Date.now();
    var put = function(obj, callback) {
      // This is a small check to avoid inconsistencies
      // We throttle the speed of the change of state by modifying the last
      // PUT in the list to the current one.
      //
      // This will cause a jump in the value sent, but will prevent any
      // out-of-order changes.
      var now = Date.now();
      if(now - lastPutTime < 200 && allListeners.tail && allListeners.tail.value) {
        var cur = allListeners.tail;
        while(cur && cur.value && cur.value.func !== put) {
          cur = cur.prev;
        }
        // If we found a PUT, we change its arguments to be this new object
        // and callback
        if(cur && cur.value && cur.value.func === put) {
          allListeners.tail.value.args = [obj, callback];
          lastPutTime = now;
          return;
        }
      }
      lastPutTime = now;

      local.transaction(function(currentSnapshot) {
        if(!currentSnapshot) {
          if(obj.__chan) return {__chan: obj.__chan};

          return obj;
        }

        __delay(put, not, obj, callback);
        return currentSnapshot;
      }, callback);
    };

    var get = function(callback) {
      // This cachedValue is used to remember the currentSnapshot and return it
      // only when we've cleared out the buffer
      var previousValue = null;
      // For this transaction, if we're taking the data we need to make sure
      // to return null (to replace the old data and indicate to others that
      // we just took it)
      local.transaction(function(currentSnapshot) {
        // If the currentSnapshot is null we'll delay the get request
        if(!currentSnapshot) {
          __delay(get, identity, callback);
          return null;
        }
        // If we're passing a channel down the pipeline, we return a channel
        // (not a lightweight representation)
        if(currentSnapshot.__chan) {
          previousValue = __channelBuilder(currentSnapshot.__chan);
          return null;
        }
        previousValue = currentSnapshot;
        return null;
      }, function(err, didWork) {
        if(err) return console.error(err);
        if(!didWork) return console.warning("Firebase didn't process any change");

        if(previousValue) callback(previousValue);
      });
    };

    // Simple wrapper around get to get all the values as soon as they are
    // available
    var getAll = function(callback) {
      get(function(v) {
        callback(v);
        getAll(callback);
      });
    };

    return {
      get: get,
      getAll: getAll,
      put: put,
      __chan: channelName
    };
  };

  var counter = 0;
  return function(channelName) {
    channelName = channelName || "chan" + counter++;
    return __channelBuilder(channelName);
  };
})();