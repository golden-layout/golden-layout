import { AssertError } from '../errors/internal-error';

/** @public */
export const enum I18nStringId {
    PopoutCannotBeCreatedWithGroundItemConfig,
    PleaseRegisterAConstructorFunction,
    ComponentIsAlreadyRegistered,
    ItemConfigIsNotTypeComponent,
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
        ComponentIsAlreadyRegistered: {
            id: I18nStringId.ComponentIsAlreadyRegistered,
            default: 'Component is already registered',
        },
        ItemConfigIsNotTypeComponent: {
            id: I18nStringId.ItemConfigIsNotTypeComponent,
            default: 'ItemConfig is not of type component',
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
