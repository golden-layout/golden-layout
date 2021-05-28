import { ContentItem, GoldenLayout, LayoutConfig, LayoutManager } from '../../dist/types';
import TestTools from './test-tools';

describe( 'layout with empty stack', function(){

	let layout: GoldenLayout;

	beforeEach(function () {
		const rootLayout: LayoutConfig = {
			root: {
				type: 'row',
				content: [
					{
						type:'component',
						componentType: TestTools.TEST_COMPONENT_NAME,
						componentState: { text: 'Component 1' }
					},{
						type:'component',
						componentType: TestTools.TEST_COMPONENT_NAME,
						componentState: { text: 'Component 2' }
					},{
						type: 'stack',
						isClosable: false,
						content: []
					}
				]
			}
		};

		layout = TestTools.createLayout(rootLayout);
	});

	afterEach(function () {
		layout?.destroy();
	});

	it( 'can be manipulated', function(){
		const row = layout.rootItem;
		expect(row?.isRow).toBe( true );

		layout.addItemAtLocation(
			{
				type:'component',
				componentType: TestTools.TEST_COMPONENT_NAME
			},
			[{ typeId: LayoutManager.LocationSelector.TypeId.FirstRow, index: 3}]
		);

		TestTools.verifyPath('3.stack.0.component', layout);
	});

	it( 'can have child added to the empty stack', function(){
		const stack = layout.rootItem?.contentItems[2];
		expect( stack?.isStack ).toBe( true );
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect( stack!.contentItems.length ).toBe( 0 );

		const addedItem = layout.newItemAtLocation(
			{
				type:'component',
				componentType: TestTools.TEST_COMPONENT_NAME
			},
			[{ typeId: LayoutManager.LocationSelector.TypeId.FirstRow, index: 2}]
		);

		const itemInOriginallyEmptyStack = TestTools.verifyPath('2.stack.0.component', layout);
		expect(itemInOriginallyEmptyStack as ContentItem | undefined).toEqual(addedItem);
	});

});
