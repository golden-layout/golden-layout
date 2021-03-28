import { GoldenLayout, LayoutConfig, LayoutManager } from '../..';
import TestTools from './test-tools';

describe('drag source', function() {

	let layout: GoldenLayout;
	let dragSourceElement: HTMLDivElement;
	const createdFromDragSourceClass = 'createdFromDragSource';

	beforeEach(function () {
		const rootLayout: LayoutConfig = {
			root: {
				type: 'stack',
				content: [
					{
						type: 'component',
						componentType: 'testComponent',
						componentState: { html: '<div id="item-1"></div>' }
					}
				]
			}
		};

		layout = TestTools.createLayout(rootLayout);
		expect(layout.isInitialised).toBeTrue();
	});

	afterEach(function () {
		layout.destroy();
	});

	it('creates a new component when dragged (static component config)', function() {
		createDragSource(false);
		doComponentDragTest();
	});

	it('creates a new component if dragged (deferred component config)', function() {
		createDragSource(true);
		doComponentDragTest();
	});

	function createDragSource(deferred: boolean): void {
		dragSourceElement = document.createElement('div');
		dragSourceElement.id = 'dragSrc';
		document.body.appendChild(dragSourceElement);

		const componentType = 'testComponent';
		const componentState = { html: `<div class="${createdFromDragSourceClass}"></div>` };
		const componentTitle = 'created from drag source';
		
		let dragSourceParameters: Parameters<typeof LayoutManager.prototype.newDragSource>;
		if (deferred) {
			dragSourceParameters = [
				dragSourceElement,
				() => ({
					type: componentType,
					state: componentState,
					title: componentTitle
				})
			];
		}
		else{
			dragSourceParameters = [dragSourceElement, componentType, componentState, componentTitle];
		}
		layout.newDragSource(...dragSourceParameters);
	}

	function doComponentDragTest(): void {
		let dragProxy = TestTools.getDragProxy();
		expect(dragProxy).toBeNull();
	
		startDrag();
		doDrag();

		dragProxy = TestTools.getDragProxy();
		expect(dragProxy).toBeInstanceOf(HTMLDivElement);

		endDrag();

		dragProxy = TestTools.getDragProxy();
		expect(dragProxy).toBeNull();

		const componentItem = TestTools.verifyPath('row.1.stack.0', layout);
		expect(componentItem.element.querySelectorAll(`.${createdFromDragSourceClass}`).length)
			.toBe(1, 'number of .dragged elements inside dropped element');
	}

	function startDrag(): void {
		const mouseDownEvent = new MouseEvent('mousedown', {
			bubbles: true,
			clientX: dragSourceElement.clientLeft,
			clientY: dragSourceElement.clientTop,
			button: 0
		});
		dragSourceElement.dispatchEvent(mouseDownEvent);
	}

	function doDrag(): void {
		const rootRect = layout.rootItem?.element.getBoundingClientRect();
		if (rootRect === undefined) {
			throw new Error ('no root rectangle!');
		}
		// choose a point on the far right side
		const mouseMoveX = rootRect.left + rootRect.width * 0.9;
		const mouseMoveY = rootRect.top + rootRect.height * 0.5;

		const mouseMoveEvent = new MouseEvent('mousemove', {
			bubbles: true,
			clientX: mouseMoveX,
			clientY: mouseMoveY
		});
		dragSourceElement.dispatchEvent(mouseMoveEvent);
	}

	function endDrag(): void {
		const mouseUpEvent = new MouseEvent('mouseup', {bubbles: true});
		dragSourceElement.dispatchEvent(mouseUpEvent);
	}
});