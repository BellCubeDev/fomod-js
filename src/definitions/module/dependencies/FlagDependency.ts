import { Dependency } from ".";
import { AttributeName, BooleanString, TagName } from "../../Enums";
import { ElementObjectMap, FlagInstance } from "../../lib";
import { FomodDocumentConfig } from "../../lib/FomodDocumentConfig";
import { Option } from "../Option";


export class FlagDependency extends Dependency {
    static override readonly tagName = TagName.FlagDependency;
    readonly tagName = TagName.FlagDependency;

    protected readonly flagInstance: FlagInstance<boolean, false>;


    get flagKey() { return this.flagInstance.name; }
    set flagKey(value: string|Option<boolean>) { this.flagInstance.name = value; }

    get desiredValue() { return this.flagInstance.usedValue; }
    set desiredValue(value: string|boolean) { this.flagInstance.usedValue = value; }

    constructor(flagName?: string, desiredValue?: string)
    constructor(flagName: Option<boolean>, desiredValue: boolean)
    constructor(flagName: string|Option<boolean> = '', desiredValue: string|boolean = '') {
        super();

        this.flagInstance = new FlagInstance(flagName as any, desiredValue as any, false);
    }

    isValid() { return true; }

    reasonForInvalidity() { return null; }

    decommission(currentDocument?: Document) {
        this.flagInstance.decommission(currentDocument);
    }

    override asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        if (typeof this.flagKey === 'string') {
            if (typeof this.desiredValue !== 'string') throw new Error('Flag dependency `name` value is a string but `value` is a boolean! Expected string.', {cause: this});
            element.setAttribute(AttributeName.Flag, this.flagKey);
            element.setAttribute(AttributeName.Value, this.desiredValue);
        } else {
            if (typeof this.flagInstance !== 'boolean') throw new Error('Flag dependency `name` value is an Option but `value` is a string! Expected boolean.', {cause: this});
            element.setAttribute(AttributeName.Flag, this.flagKey.getFlagName(document));
            element.setAttribute(AttributeName.Value, this.desiredValue ? BooleanString.true : BooleanString.false);
        }

        return element;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): FlagDependency {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const flagName = element.getAttribute(AttributeName.Flag) ?? ''; // TODO: Parse Option Flags
        const desiredValue = element.getAttribute(AttributeName.Value) ?? '';

        const obj = new FlagDependency(flagName, desiredValue);
        obj.assignElement(element);
        return obj;
    }
}
