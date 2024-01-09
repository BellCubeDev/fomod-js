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
    set desiredValue(value: string|true) { this.flagInstance.usedValue = value; }

    constructor(flagName?: string, desiredValue?: string)
    constructor(flagName: Option<boolean>, desiredValue: true)
    constructor(flagName: string|Option<boolean> = '', desiredValue: string|true = '') {
        super();

        this.flagInstance = new FlagInstance(flagName as any, desiredValue as any, false);
    }

    isValid() { return true; }

    reasonForInvalidity() { return null; }

    associateWithDocument(document: Document) {
        this.flagInstance.associateWithDocument(document);
    }

    decommission(currentDocument?: Document) {
        this.flagInstance.decommission(currentDocument);
    }

    override asElement(document: Document, config?: FomodDocumentConfig, knownOptions: Option<boolean>[] = []): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        if (typeof this.flagKey === 'string') {
            if (typeof this.desiredValue !== 'string') throw new Error('Flag dependency `name` value is a string but `value` is a boolean! Expected string.', {cause: this});
            element.setAttribute(AttributeName.Flag, this.flagKey);
            element.setAttribute(AttributeName.Value, this.desiredValue);
        } else {
            if (this.desiredValue !== true) throw new Error('Flag dependency `name` value is an Option but `value` is a string! Expected boolean.', {cause: this});
            const setter = this.flagKey.getOptionFlagSetter(document, config, knownOptions);
            element.setAttribute(AttributeName.Flag, setter.name);
            element.setAttribute(AttributeName.Value, setter.value);
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
