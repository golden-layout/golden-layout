const lm = require('../dist/goldenlayout').__lm;

const spyOn = (obj, prop) => Object.assign(obj, { [prop]: jest.fn() });

describe('the EventEmitter works', () => {
  const EmitterImplementor = function() {
    lm.utils.EventEmitter.call(this);
  };

  test('is possible to inherit from EventEmitter', () => {
    const myObject = new EmitterImplementor();
    expect(typeof myObject.on).toBe('function');
    expect(typeof myObject.unbind).toBe('function');
    expect(typeof myObject.trigger).toBe('function');
  });

  test('notifies callbacks', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };

    spyOn(myListener, 'callback');
    expect(myListener.callback).not.toHaveBeenCalled();

    myObject.on('someEvent', myListener.callback);

    expect(myListener.callback).not.toHaveBeenCalled();

    myObject.emit('someEvent', 'Good', 'Morning');

    expect(myListener.callback).toHaveBeenCalledWith('Good', 'Morning');
    expect(myListener.callback.mock.calls).toHaveLength(1);
  });

  test("triggers an 'all' event", () => {
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
    expect(myListener.callback.mock.calls).toHaveLength(1);
    expect(myListener.allCallback).toHaveBeenCalledWith('someEvent', 'Good', 'Morning');
    expect(myListener.allCallback.mock.calls).toHaveLength(1);

    myObject.emit('someOtherEvent', 123);

    expect(myListener.callback.mock.calls).toHaveLength(1);
    expect(myListener.allCallback).toHaveBeenCalledWith('someOtherEvent', 123);
    expect(myListener.allCallback.mock.calls).toHaveLength(2);
  });

  test('triggers sets the right context', () => {
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

  test('unbinds events', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };
    spyOn(myListener, 'callback');
    myObject.on('someEvent', myListener.callback);
    expect(myListener.callback.mock.calls).toHaveLength(0);
    myObject.emit('someEvent');
    expect(myListener.callback.mock.calls).toHaveLength(1);
    myObject.unbind('someEvent', myListener.callback);
    myObject.emit('someEvent');
    expect(myListener.callback.mock.calls).toHaveLength(1);
  });

  test('unbinds all events if no context is provided', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };
    spyOn(myListener, 'callback');
    myObject.on('someEvent', myListener.callback);
    expect(myListener.callback.mock.calls).toHaveLength(0);
    myObject.emit('someEvent');
    expect(myListener.callback.mock.calls).toHaveLength(1);
    myObject.unbind('someEvent');
    myObject.emit('someEvent');
    expect(myListener.callback.mock.calls).toHaveLength(1);
  });

  test('unbinds events for a specific context only', () => {
    const myObject = new EmitterImplementor();
    const myListener = { callback() {} };
    const contextA = { name: 'a' };
    const contextB = { name: 'b' };
    spyOn(myListener, 'callback');
    myObject.on('someEvent', myListener.callback, contextA);
    myObject.on('someEvent', myListener.callback, contextB);
    expect(myListener.callback.mock.calls).toHaveLength(0);
    myObject.emit('someEvent');
    expect(myListener.callback.mock.calls).toHaveLength(2);
    myObject.unbind('someEvent', myListener.callback, contextA);
    myObject.emit('someEvent');
    expect(myListener.callback.mock.calls).toHaveLength(3);
    myObject.unbind('someEvent', myListener.callback, contextB);
    myObject.emit('someEvent');
    expect(myListener.callback.mock.calls).toHaveLength(3);
  });

  test('throws an exception when trying to unsubscribe for a non existing method', () => {
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

  test('throws an exception when attempting to bind a non-function', () => {
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
