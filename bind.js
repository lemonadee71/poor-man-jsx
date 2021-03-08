const bind = (data, targetEl) => {
  let { proxy, revoke } = Proxy.revocable(data.target, {
    set(target, prop, val, receiver) {
      // if the prop set is equal to the prop we are watching
      // update the element bound to its
      console.log(`Calling proxy for ${targetEl.target}`);
      if (prop === data.prop) {
        let targetElement = document.querySelector(targetEl.target);

        // check if the element bound to our data still exists
        if (targetElement) {
          let finalValue = data.func ? data.func.call(data.target, val) : val;

          targetElement[targetEl.prop] = targetEl.func
            ? targetEl.func.call(targetElement, finalValue)
            : finalValue;

          // if not, we assume that it's removed
          // then we revoke our proxy
          // then delete it from our store
        } else {
          console.log(`Revoking ${targetEl.target}`);
          // dataStore[targetEl.target].revoke();
          // delete dataStore[targetEl.target];
        }
      }

      return Reflect.set(target, prop, val, receiver);
    },
  });

  // data.target = proxy;
  // store the revoke associated with our proxy
  // so we can call it later
  // dataStore[targetEl.target] = {};
  // dataStore[targetEl.target].revoke = revoke;

  return [proxy, revoke];
};
