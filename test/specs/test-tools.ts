import { ComponentContainer, ContentItem, GoldenLayout, JsonValue, LayoutConfig, RowOrColumn, Stack } from '../..';

export default class TestTools {
	public static readonly TEST_COMPONENT_NAME = 'testComponent';

	public static createLayout(config: LayoutConfig): GoldenLayout {
		const myLayout = new GoldenLayout();

		myLayout.registerComponentFactoryFunction(this.TEST_COMPONENT_NAME, TestTools.createTestComponent);

		myLayout.loadLayout(config);

		expect(myLayout.isInitialised).toBeTrue();

		return myLayout;
	}

	public static createTestComponent( container: ComponentContainer, state?: JsonValue): void {
		if ( state === undefined ) {
			const span = document.createElement('span');
			span.innerText = 'that worked';
			container.element.appendChild
		}
		else if (state) {
			const html = (state as {html: string}).html;
			if (html) {
				container.element.outerHTML = html;
			}
		}
	}

	/**
	 * Takes a path of type.index.type.index, and returns the corresponding resolved item config
	 * 
	 * @example
	 * verifyPath('row.0.stack.1.component', layout)
	 * // returns object of type ComponentItemConfig
	 */
	public static verifyPath(path: string, layout: GoldenLayout): ContentItem {
		let rootItem = layout.rootItem;
		expect(rootItem).toBeTruthy();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		rootItem = rootItem!;

		const pathSegments = path.split( '.' );

		let node: ContentItem = rootItem;
		for (let i = 0; i < pathSegments.length; i++) {
			const pathSegment = pathSegments[i];
			const pathSegmentAsInt = parseInt(pathSegment, 10);

			if (isNaN(pathSegmentAsInt)) {
				expect(node.type).toBe(pathSegment);
			}
			else {
				expect(node.isStack || node.isRow || node.isColumn).toBeTrue();
				node = (node as unknown as Stack | RowOrColumn).contentItems[pathSegmentAsInt]
				expect(node).toBeDefined();
			}
		}
		return node;
	}

	public static getDragProxy(): HTMLDivElement | null {
		// class copied from DomConstants.ClassName.DragProxy (could instead expose this in public API?)
		const dragProxy = document.querySelector('.lm_dragProxy') as HTMLDivElement;
		return dragProxy;
	}
}
