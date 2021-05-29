import { GoldenLayout, LayoutConfig } from '../../dist/types';
import TestTools from './test-tools';

describe( 'ground item', function() { 

	let layout: GoldenLayout;

	afterAll(function () {
		layout?.destroy();
	});

	it( 'component gets wrapped in a stack', function() {
		const rootLayout: LayoutConfig = {
			root: {
				type: 'component',
				componentType: TestTools.TEST_COMPONENT_NAME
			}
		};

		layout = TestTools.createLayout(rootLayout);

		const glElements = document.querySelectorAll('.lm_goldenlayout');
		expect(glElements.length).toBe(1);
		TestTools.verifyPath('stack.0.component', layout);
	});
});
