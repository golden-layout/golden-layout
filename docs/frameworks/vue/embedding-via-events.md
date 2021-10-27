# Using Vue with 'embedding via events' component binding

The following snippets of code demonstrate how Golden Layout can be used in Vue using [**embedding via events**](../../binding-components.md#embedding-via-events) component binding. Note that it is recommended to use [**virtual via events**](../../binding-components.md#virtual-via-events) binding (ie Virtual Components) however some users may prefer this approach as less events are involved.

### Composable Hook

```typescript
import { GoldenLayout, LayoutConfig } from 'golden-layout';
import { onMounted, ref, shallowRef } from 'vue';

export const isClient = typeof window !== 'undefined';
export const isDocumentReady = () => isClient && document.readyState === 'complete' && document.body != null;

export function useDocumentReady(func: () => void) {
    onMounted(() => {
        console.log(isDocumentReady());
        if (isDocumentReady()) func();
        else
            document.addEventListener('readystatechange', () => isDocumentReady() && func(), {
                passive: true,
            });
    });
}

export function useGoldenLayout(
    createComponent: (type: string, container: HTMLElement) => ComponentContainer.Component,
    destroyComponent: (container: HTMLElement) => void,
    config?: LayoutConfig
) {
    const element = shallowRef<HTMLElement | null>(null);
    const layout = shallowRef<GoldenLayout | null>(null);
    const initialized = ref(false);

    useDocumentReady(() => {
        if (element.value == null) throw new Error('Element must be set.');
        const goldenLayout = new GoldenLayout(element.value);

        goldenLayout.bindComponentEvent = (container, itemConfig) => {
            const { componentType } = itemConfig;
            if (typeof componentType !== 'string') throw new Error('Invalid component type.');
            const component = createComponent(componentType, container.element);
            return {
                component,
                virtual: false,
            }
        }
        goldenLayout.unbindComponentEvent = container => {
            destroyComponent(container.element);
        }

        if (config != null) goldenLayout.loadLayout(config);

        // https://github.com/microsoft/TypeScript/issues/34933
        layout.value = goldenLayout as any;

        initialized.value = true;
    });

    return { element, initialized, layout };
}
```
### Usage

```vue
<template>
  <div ref="element" style="width: 100%; height: 75vh">
    <teleport
      v-for="{ id, type, element } in componentInstances"
      :key="id"
      :to="element"
    >
      <component :is="type"></component>
    </teleport>
  </div>
</template>
<script lang="ts">
import { useGoldenLayout } from "@/use-golden-layout";
import { defineComponent, h, shallowRef } from "vue";
import "golden-layout/dist/css/goldenlayout-base.css";
import "golden-layout/dist/css/themes/goldenlayout-dark-theme.css";

const Test = defineComponent({ render: () => h('span', 'It works!') });

const components = { Test, /* other components */ };

export default defineComponent({
  components,
  setup() {
    interface ComponentInstance {
      id: number;
      type: string;
      element: HTMLElement;
    }
    let instanceId = 0;
    const componentTypes = new Set(Object.keys(components));
    const componentInstances = shallowRef<ComponentInstance[]>([]);

    const createComponent = (type: string, element: HTMLElement) => {
      if (!componentTypes.has(type)) {
        throw new Error(`Component not found: '${type}'`);
      }
      ++instanceId;
      componentInstances.value = componentInstances.value.concat({
        id: instanceId,
        type,
        element,
      });
    };
    const destroyComponent = (toBeRemoved: HTMLElement) => {
      componentInstances.value = componentInstances.value.filter(
        ({ element }) => element !== toBeRemoved
      );
    };

    const { element } = useGoldenLayout(createComponent, destroyComponent, {
      root: {
        type: "column",
        content: [
          {
            type: "component",
            componentType: "Test",
          },
          {
            type: "component",
            componentType: "Test",
          },
        ],
      },
    });

    return { element, componentInstances };
  },
});
</script>
```
