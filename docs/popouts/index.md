# Using Popouts

Popouts are supported, although the scope is more limited than in the original v1. Popouts are enabled by default for all content items. Popouts are disabled by either setting `{ popout: false }` in the `header` configuration or when a component is not closable. Also, as a popout user, if you are using registration binding, make sure to register all component types before initializing the golden-layout instance in your child windows.

Popouts will not be automatically destroyed when a page unloads.  If an application wants to remove the page's popouts when it unloads, the application should call the `LayoutManager.closeAllOpenPopouts()` function as part of its page unload handling.

Popout examples are available in the `standard` and `tabDropdown` layouts within the apitest application.

EventHub can be used to broadcast messages and events to all windows.  The LayoutManager.eventHub.emitUserBroadcast() function is used to broadcast messages.  Messages can be received by listening to “userBroadcast” events.  For example:

```typescript
layoutManager.eventHub.on('userBroadcast',  (...ev: EventEmitter.UnknownParams) => {
  // respond to user broadcast event
});
```

See event-component.ts in apitest for a complete example of broadcasting user messages.

## Limitations

- The EventHub is restricted to `userBroadcast` events, other event types will not be broadcasted between windows.
- This means the you have to take care of propagating state changes between windows yourself.

