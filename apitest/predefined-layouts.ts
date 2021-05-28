import { EventComponent } from './event-component';
import { ComponentItemConfig, ItemType, LayoutConfig, StackItemConfig } from '..';
import { BooleanComponent } from './boolean-component';
import { ColorComponent } from './color-component';
import { TextComponent } from './text-component';

export interface Layout {
    name: string;
    config: LayoutConfig;
}

const miniRowConfig: LayoutConfig = {
    root: {
        type: ItemType.row,
        content: [
            {
                type: "component",
                title: "Golden",
                header: {
                    show: "top",
                },
                isClosable: false,
                componentType: ColorComponent.typeName,
                width: 30,
                componentState: 'gold',
            } as ComponentItemConfig,
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: undefined,
            } as ComponentItemConfig,
        ],
    },
};

const miniRowLayout: Layout = {
    name: 'miniRow',
    config: miniRowConfig,
};

const miniStackConfig: LayoutConfig = {
    root: {
        type: ItemType.stack,
        content: [
            {
                type: "component",
                title: "Golden",
                header: {
                    show: "top",
                },
                componentType: ColorComponent.typeName,
                width: 30,
                componentState: 'white',
            } as ComponentItemConfig,
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: 'green',
            } as ComponentItemConfig,
        ],
    }
};

const miniStackLayout: Layout = {
    name: 'miniStack',
    config: miniStackConfig,
};

const rowWithEmptyStackConfig: LayoutConfig = {
    root: {
        type: ItemType.row,
        content: [
            {
                type: "component",
                title: "Golden",
                componentType: ColorComponent.typeName,
                width: 30,
                componentState: 'gold',
            } as ComponentItemConfig,
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: undefined,
            } as ComponentItemConfig,
            {
                type: "stack",
                isClosable: false,
                content: []
            } as StackItemConfig,
        ],
    },
};

const rowWithEmptyStackLayout: Layout = {
    name: 'row with empty stack',
    config: rowWithEmptyStackConfig,
};

const componentConfig: LayoutConfig = {
    root: {
        type: ItemType.component,
        title: "Layout",
        header: { show: "top", popout: false },
        componentType: ColorComponent.typeName,
        componentState: 'green',
    } as ComponentItemConfig,
};

const component: Layout = {
    name: 'component',
    config: componentConfig,
};

const standardConfig: LayoutConfig = {
    settings: {
        popoutWholeStack: true,
        popInOnClose: true,
    },
    root: {
        type: "row",
        content: [
            {
                width: 80,
                type: "column",
                content: [
                    {
                        title: "Fnts 100",
                        header: { show: "bottom" },
                        type: "component",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "row",
                        content: [
                            {
                                type: "component",
                                title: "Golden",
                                header: { show: "right" },
                                isClosable: false,
                                componentType: ColorComponent.typeName,
                                width: 30,
                                componentState: {
                                    bg: "golden_layout_spiral.png",
                                },
                            } as ComponentItemConfig,
                            {
                                title: "Layout",
                                header: {
                                    show: "left",
                                    popout: false,
                                },
                                type: "component",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    bg: "golden_layout_text.png",
                                },
                            } as ComponentItemConfig,
                        ],
                    },
                    {
                        type: "stack",
                        content: [
                            {
                                type: "component",
                                title: "Acme, inc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock X",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            } as ComponentItemConfig,
                        ],
                    },
                ],
            },
            {
                width: 50,
                type: "row",
                title: "test stack",
                content: [
                    {
                        type: "stack",
                        title: "test row",
                        content: [
                            {
                                type: "component",
                                title: "comp 1",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock X",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "comp 1",
                                componentType: EventComponent.typeName,
                                componentState: {
                                    companyName: "Event",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "comp 2",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "comp 3",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            } as ComponentItemConfig,
                        ],
                    },
                ],
            },
        ],
    },
};

const standardLayout: Layout = {
    name: 'standard',
    config: standardConfig,
};

const responsiveConfig: LayoutConfig = {
    settings: {
        responsiveMode: "always",
    },
    dimensions: {
        minItemWidth: 250,
    },
    root: {
        type: "row",
        content: [
            {
                width: 30,
                type: "column",
                content: [
                    {
                        title: "Fnts 100",
                        type: "component",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "row",
                        content: [
                            {
                                type: "component",
                                title: "Golden",
                                componentType: ColorComponent.typeName,
                                width: 30,
                                componentState: {
                                    bg: "golden_layout_spiral.png",
                                },
                            } as ComponentItemConfig,
                        ],
                    },
                    {
                        type: "stack",
                        content: [
                            {
                                type: "component",
                                title: "Acme, inc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock X",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            } as ComponentItemConfig,
                        ],
                    },
                ],
            },
            {
                width: 30,
                title: "Layout",
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: { bg: "golden_layout_text.png" },
            } as ComponentItemConfig,
            {
                width: 20,
                type: "component",
                title: "Market",
                componentType: ColorComponent.typeName,
                componentState: {
                    className: "market-content",
                    style: [
                        ".market-content label {",
                        "  margin-top: 10px",
                        "  display: block",
                        "  text-align: left",
                        "}",
                        ".market-content input {",
                        "  width: 250px",
                        "  border: 1px solid red",
                        "}",
                    ],
                    html: [
                        '<label for="name">Name<label>',
                        '<input id="name" type="text"></input>',
                    ],
                },
            } as ComponentItemConfig,
            {
                width: 20,
                type: "column",
                content: [
                    {
                        height: 20,
                        type: "component",
                        title: "Performance",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        height: 80,
                        type: "component",
                        title: "Profile",
                        componentType: ColorComponent.typeName,
                    },
                ],
            },
        ],
    },
};

const responsiveLayout: Layout = {
    name: 'responsive',
    config: responsiveConfig,
};

const tabDropdownConfig: LayoutConfig = {
    settings: {
        tabOverlapAllowance: 25,
        reorderOnTabMenuClick: false,
        tabControlOffset: 5,
    },
    root: {
        type: "row",
        content: [
            {
                width: 30,
                type: "column",
                content: [
                    {
                        title: "Fnts 100",
                        type: "component",
                        componentType: TextComponent.typeName,
                    },
                    {
                        type: "row",
                        content: [
                            {
                                type: "component",
                                title: "Golden",
                                componentType: TextComponent.typeName,
                                width: 30,
                                componentState: {
                                    text: 'hello',
                                },
                            } as ComponentItemConfig,
                        ],
                    },
                    {
                        type: "stack",
                        content: [
                            {
                                type: "component",
                                title: "Acme, inc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock X",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            } as ComponentItemConfig,
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            } as ComponentItemConfig,
                        ],
                    },
                ],
            },
            {
                width: 20,
                type: "stack",
                content: [
                    {
                        type: "component",
                        title: "Market",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "component",
                        title: "Performance",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "component",
                        title: "Trend",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "component",
                        title: "Balance",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "component",
                        title: "Budget",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "component",
                        title: "Curve",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "component",
                        title: "Standing",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        type: "component",
                        title: "Lasting",
                        componentType: ColorComponent.typeName,
                        componentState: {
                            bg: "golden_layout_spiral.png",
                        },
                    } as ComponentItemConfig,
                    {
                        type: "component",
                        title: "Profile",
                        componentType: ColorComponent.typeName,
                    },
                ],
            },
            {
                width: 30,
                title: "Layout",
                type: "component",
                componentType: BooleanComponent.typeName,
                componentState: true,
            } as ComponentItemConfig,
        ],
    },
};

const tabDropdownLayout: Layout = {
    name: 'tabDropdown',
    config: tabDropdownConfig,
};

export interface PredefinedLayouts {
    colorComponentCompatible: Layout[];
    allComponents: Layout[];
}

export const prefinedLayouts: PredefinedLayouts = {
    colorComponentCompatible: [miniRowLayout, miniStackLayout, rowWithEmptyStackLayout, component, standardLayout],
    allComponents: [miniRowLayout, miniStackLayout, component, responsiveLayout, standardLayout, tabDropdownLayout]
};
