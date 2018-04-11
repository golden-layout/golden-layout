describe('the EventEmitter works', () => {
  const EmitterImplementor = function() {
    lm.utils.EventEmitter.call(this);
  };

  it('is possible to inherit from EventEmitter', () => {
    const myObject = new EmitterImplementor();
    expect(typeof myObject.on).toBe('function');
    expect(typeof myObject.unbind).toBe('function');
    expect(typeof myObject.trigger).toBe('function');
  });

  it('notifies callbacks', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };
    spyOn(myListener, 'callback');
    expect(myListener.callback).not.toHaveBeenCalled();
    myObject.on('someEvent', myListener.callback);
    expect(myListener.callback).not.toHaveBeenCalled();
    myObject.emit('someEvent', 'Good', 'Morning');
    expect(myListener.callback).toHaveBeenCalledWith('Good', 'Morning');
    expect(myListener.callback.calls).toHaveLength(1);
  });

  it("triggers an 'all' event", () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {}, allCallback() {} };
    spyOn(myListener, 'callback');
    spyOn(myListener, 'allCallback');

    myObject.on('someEvent', myListener.callback);
    myObject.on(lm.utils.EventEmitter.ALL_EVENT, myListener.allCallback);

    expect(myListener.callback).not.toHaveBeenCalled();
    expect(myListener.allCallback).not.toHaveBeenCalled();
    myObject.emit('someEvent', 'Good', 'Morning');
    expect(myListener.callback).toHaveBeenCalledWith('Good', 'Morning');
    expect(myListener.callback.calls).toHaveLength(1);
    expect(myListener.allCallback).toHaveBeenCalledWith('someEvent', 'Good', 'Morning');
    expect(myListener.allCallback.calls).toHaveLength(1);

    myObject.emit('someOtherEvent', 123);
    expect(myListener.callback.calls).toHaveLength(1);
    expect(myListener.allCallback).toHaveBeenCalledWith('someOtherEvent', 123);
    expect(myListener.allCallback.calls).toHaveLength(2);
  });

  it('triggers sets the right context', () => {
    const myObject = new EmitterImplementor();
    let context = null;
    const myListener = {
      callback() {
        context = this;
      },
    };

    myObject.on('someEvent', myListener.callback, { some: 'thing' });
    expect(context).toBe(null);
    myObject.emit('someEvent');
    expect(context.some).toBe('thing');
  });

  it('unbinds events', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };
    spyOn(myListener, 'callback');
    myObject.on('someEvent', myListener.callback);
    expect(myListener.callback.calls).toHaveLength(0);
    myObject.emit('someEvent');
    expect(myListener.callback.calls).toHaveLength(1);
    myObject.unbind('someEvent', myListener.callback);
    myObject.emit('someEvent');
    expect(myListener.callback.calls).toHaveLength(1);
  });

  it('unbinds all events if no context is provided', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };
    spyOn(myListener, 'callback');
    myObject.on('someEvent', myListener.callback);
    expect(myListener.callback.calls).toHaveLength(0);
    myObject.emit('someEvent');
    expect(myListener.callback.calls).toHaveLength(1);
    myObject.unbind('someEvent');
    myObject.emit('someEvent');
    expect(myListener.callback.calls).toHaveLength(1);
  });

  it('unbinds events for a specific context only', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };
    const contextA = { name: 'a' };
    const contextB = { name: 'b' };
    spyOn(myListener, 'callback');
    myObject.on('someEvent', myListener.callback, contextA);
    myObject.on('someEvent', myListener.callback, contextB);
    expect(myListener.callback.calls).toHaveLength(0);
    myObject.emit('someEvent');
    expect(myListener.callback.calls).toHaveLength(2);
    myObject.unbind('someEvent', myListener.callback, contextA);
    myObject.emit('someEvent');
    expect(myListener.callback.calls).toHaveLength(3);
    myObject.unbind('someEvent', myListener.callback, contextB);
    myObject.emit('someEvent');
    expect(myListener.callback.calls).toHaveLength(3);
  });

  it('throws an exception when trying to unsubscribe for a non existing method', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };

    myObject.on('someEvent', myListener.callback);

    expect(() => {
      myObject.unbind('someEvent', () => {});
    }).toThrow();

    expect(() => {
      myObject.unbind('doesNotExist', myListener.callback);
    }).toThrow();

    expect(() => {
      myObject.unbind('someEvent', myListener.callback);
    }).not.toThrow();
  });

  it('throws an exception when attempting to bind a non-function', () => {
    const myObject = new EmitterImplementor();

    expect(() => {
      myObject.on('someEvent', 1);
    }).toThrow();

    expect(() => {
      myObject.on('someEvent', undefined);
    }).toThrow();

    expect(() => {
      myObject.on('someEvent', {});
    }).toThrow();
  });
});
