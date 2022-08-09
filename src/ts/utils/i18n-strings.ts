import { AssertError } from '../errors/internal-error';

/** @public */
export const enum I18nStringId {
    PopoutCannotBeCreatedWithGroundItemConfig,
    PleaseRegisterAConstructorFunction,
    ComponentTypeNotRegisteredAndBindComponentEventHandlerNotAssigned,
    ComponentIsAlreadyRegistered,
    ComponentIsNotVirtuable,
    VirtualComponentDoesNotHaveRootHtmlElement,
    ItemConfigIsNotTypeComponent,
    InvalidNumberPartInSizeString,
    UnknownUnitInSizeString,
    UnsupportedUnitInSizeString,
}

/** @public */
export namespace I18nStrings {
    /** @internal */
    let initialised = false;

    /** @internal */
    interface Info {
        readonly id: I18nStringId;
        readonly default: string;
    }

    /** @internal */
    type InfosObject = { [id in keyof typeof I18nStringId]: Info };

    /** @internal */
    const infosObject: InfosObject = {
        PopoutCannotBeCreatedWithGroundItemConfig: {
            id: I18nStringId.PopoutCannotBeCreatedWithGroundItemConfig,
            default: 'Popout cannot be created with ground ItemConfig'
        },
        PleaseRegisterAConstructorFunction: {
            id: I18nStringId.PleaseRegisterAConstructorFunction,
            default: 'Please register a constructor function'
        },
        ComponentTypeNotRegisteredAndBindComponentEventHandlerNotAssigned: {
            id: I18nStringId.ComponentTypeNotRegisteredAndBindComponentEventHandlerNotAssigned,
            default: 'Component type not registered and BindComponentEvent handler not assigned',
        },
        ComponentIsAlreadyRegistered: {
            id: I18nStringId.ComponentIsAlreadyRegistered,
            default: 'Component is already registered',
        },
        ComponentIsNotVirtuable: {
            id: I18nStringId.ComponentIsNotVirtuable,
            default: 'Component is not virtuable. Requires rootHtmlElement field/getter',
        },
        VirtualComponentDoesNotHaveRootHtmlElement: {
            id: I18nStringId.VirtualComponentDoesNotHaveRootHtmlElement,
            default: 'Virtual component does not have getter "rootHtmlElement"',
        },
        ItemConfigIsNotTypeComponent: {
            id: I18nStringId.ItemConfigIsNotTypeComponent,
            default: 'ItemConfig is not of type component',
        },

        InvalidNumberPartInSizeString: {
            id: I18nStringId.InvalidNumberPartInSizeString,
            default: 'Invalid number part in size string',
        },
        UnknownUnitInSizeString: {
            id: I18nStringId.UnknownUnitInSizeString,
            default: 'Unknown unit in size string',
        },
        UnsupportedUnitInSizeString: {
            id: I18nStringId.UnsupportedUnitInSizeString,
            default: 'Unsupported unit in size string',
        },
    }

    export const idCount = Object.keys(infosObject).length;
    /** @internal */
    const infos = Object.values(infosObject);

    export function checkInitialise(): void {
        if (!initialised) {
            for (let i = 0; i < idCount; i++) {
                const info = infos[i];
                if (info.id !== i) {
                    throw new AssertError('INSI00110', `${i}: ${info.id}`);
                } else {
                    i18nStrings[i] = info.default;
                }
            }
        }
        initialised = true;
    }
}

/** @public */
export const i18nStrings = new Array<string>(I18nStrings.idCount);
