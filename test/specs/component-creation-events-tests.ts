import { GoldenLayout, ComponentContainer, LayoutConfig } from '../..';

describe('component creation', function () {

	let layout: GoldenLayout;
	const eventListener = globalThis.jasmine.createSpyObj<{itemCreated(): void}>(['itemCreated']);

	beforeAll(function () {
		layout = new GoldenLayout();

		function Recorder(container: ComponentContainer) {
			const span = document.createElement('span');
			span.innerText = 'that worked';
			container.element.appendChild(span);
		}

		layout.registerComponentFactoryFunction('testComponent', Recorder);

		layout.addEventListener('itemCreated', eventListener.itemCreated);
	});

	afterAll(function () {
		layout.destroy();
	});

	it('results in an event emitted for each component in the layout', function () {
		expect(eventListener.itemCreated).not.toHaveBeenCalled();

		const config: LayoutConfig = {
			root: {
				type: 'column',
				content: [
					{
						type: 'stack',
						content: [
							{
								type: 'component',
								componentType: 'testComponent'
							}
						]
					}
				]
			}
		};

		layout.loadLayout(config);

		expect(eventListener.itemCreated.calls.count()).toBe(3);
	});
});
