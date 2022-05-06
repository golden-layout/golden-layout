import { ItemType, LayoutConfig, StackItemConfig } from '..';
import { BooleanComponent } from './boolean-component';
import { ColorComponent } from './color-component';
import { EventComponent } from './event-component';
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
                size: '30%',
                componentState: 'gold',
            },
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: undefined,
            },
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
                size: '30%',
                componentState: 'white',
            },
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: 'green',
            },
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
                size: '30%',
                componentState: 'gold',
            },
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: undefined,
            },
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
    },
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
                size: '80%',
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
                                size: '30%',
                                componentState: {
                                    bg: "golden_layout_spiral.png",
                                },
                            },
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
                            },
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
                            },
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            },
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            },
                        ],
                    },
                ],
            },
            {
                size: '50%',
                type: "row",
                content: [
                    {
                        type: "stack",
                        content: [
                            {
                                type: "component",
                                title: "comp 1",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock X",
                                },
                            },
                            {
                                type: "component",
                                title: "comp 1",
                                componentType: EventComponent.typeName,
                                componentState: {
                                    companyName: "Event",
                                },
                            },
                            {
                                type: "component",
                                title: "comp 2",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            },
                            {
                                type: "component",
                                title: "comp 3",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            },
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
        defaultMinItemWidth: '250px',
    },
    root: {
        type: "row",
        content: [
            {
                size: '30%',
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
                                size: '30%',
                                componentState: {
                                    bg: "golden_layout_spiral.png",
                                },
                            },
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
                            },
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            },
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            },
                        ],
                    },
                ],
            },
            {
                size: '30%',
                title: "Layout",
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: { bg: "golden_layout_text.png" },
            },
            {
                size: '20%',
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
            },
            {
                size: '20%',
                type: "column",
                content: [
                    {
                        size: '20%',
                        type: "component",
                        title: "Performance",
                        componentType: ColorComponent.typeName,
                    },
                    {
                        size: '80%',
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
                size: '30%',
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
                                size: '30%',
                                componentState: {
                                    text: 'hello',
                                },
                            },
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
                            },
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            },
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            },
                        ],
                    },
                ],
            },
            {
                size: '20%',
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
                    },
                    {
                        type: "component",
                        title: "Profile",
                        componentType: ColorComponent.typeName,
                    },
                ],
            },
            {
                size: '30%',
                title: "Layout",
                type: "component",
                componentType: BooleanComponent.typeName,
                componentState: true,
            },
        ],
    },
};

const tabDropdownLayout: Layout = {
    name: 'tabDropdown',
    config: tabDropdownConfig,
};

const miniRowConfig_widthHeight: LayoutConfig = {
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
            },
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: undefined,
            },
        ],
    },
};

const miniRowLayout_widthHeight: Layout = {
    name: 'miniRow (WidthHeight)',
    config: miniRowConfig_widthHeight,
};

const miniStackConfig_widthHeight: LayoutConfig = {
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
            },
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: 'green',
            },
        ],
    }
};

const miniStackLayout_widthHeight: Layout = {
    name: 'miniStack (WidthHeight)',
    config: miniStackConfig_widthHeight,
};

const rowWithEmptyStackConfig_widthHeight: LayoutConfig = {
    root: {
        type: ItemType.row,
        content: [
            {
                type: "component",
                title: "Golden",
                componentType: ColorComponent.typeName,
                width: 30,
                componentState: 'gold',
            },
            {
                title: "Layout",
                header: { show: "top", popout: false },
                type: "component",
                componentType: ColorComponent.typeName,
                componentState: undefined,
            },
            {
                type: "stack",
                isClosable: false,
                content: []
            } as StackItemConfig,
        ],
    },
};

const rowWithEmptyStackLayout_widthHeight: Layout = {
    name: 'row with empty stack (WidthHeight)',
    config: rowWithEmptyStackConfig_widthHeight,
};

const componentConfig_widthHeight: LayoutConfig = {
    root: {
        type: ItemType.component,
        title: "Layout",
        header: { show: "top", popout: false },
        componentType: ColorComponent.typeName,
        componentState: 'green',
    },
};

const component_widthHeight: Layout = {
    name: 'component (WidthHeight)',
    config: componentConfig_widthHeight,
};

const standardConfig_widthHeight: LayoutConfig = {
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
                            },
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
                            },
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
                            },
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            },
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            },
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
                            },
                            {
                                type: "component",
                                title: "comp 1",
                                componentType: EventComponent.typeName,
                                componentState: {
                                    companyName: "Event",
                                },
                            },
                            {
                                type: "component",
                                title: "comp 2",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            },
                            {
                                type: "component",
                                title: "comp 3",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    },
};

const standardLayout_widthHeight: Layout = {
    name: 'standard (WidthHeight)',
    config: standardConfig_widthHeight,
};

const responsiveConfig_widthHeight: LayoutConfig = {
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
                            },
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
                            },
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            },
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            },
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
            },
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
            },
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

const responsiveLayout_widthHeight: Layout = {
    name: 'responsive (WidthHeight)',
    config: responsiveConfig_widthHeight,
};

const tabDropdownConfig_widthHeight: LayoutConfig = {
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
                            },
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
                            },
                            {
                                type: "component",
                                title: "LexCorp plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Y",
                                },
                            },
                            {
                                type: "component",
                                title: "Springshield plc.",
                                componentType: ColorComponent.typeName,
                                componentState: {
                                    companyName: "Stock Z",
                                },
                            },
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
                    },
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
            },
        ],
    },
};

const tabDropdownLayout_widthHeight: Layout = {
    name: 'tabDropdown (WidthHeight)',
    config: tabDropdownConfig_widthHeight,
};

export interface PredefinedLayouts {
    colorComponentCompatible: Layout[];
    allComponents: Layout[];
}

export const prefinedLayouts: PredefinedLayouts = {
    colorComponentCompatible: [
        miniRowLayout, miniStackLayout, rowWithEmptyStackLayout, component, standardLayout,
        miniRowLayout_widthHeight, miniStackLayout_widthHeight, rowWithEmptyStackLayout_widthHeight, component_widthHeight, standardLayout_widthHeight
    ],
    allComponents: [
        miniRowLayout, miniStackLayout, component, responsiveLayout, standardLayout, tabDropdownLayout,
        miniRowLayout_widthHeight, miniStackLayout_widthHeight, component_widthHeight, responsiveLayout_widthHeight, standardLayout_widthHeight, tabDropdownLayout_widthHeight,
    ]
};
