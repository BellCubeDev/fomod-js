import { Dependency } from ".";
import { AttributeName, FileDependencyState, TagName } from "../../Enums";
import { ElementObjectMap, InvalidityReason, InvalidityReport, Verifiable } from "../../lib";
import { FomodDocumentConfig } from "../../lib/FomodDocumentConfig";
import type { Option } from "../Option";


export class FileDependency<TStrict extends boolean> extends Dependency<TStrict> {
    static override readonly tagName = TagName.FileDependency;
    readonly tagName = TagName.FileDependency;

    constructor(public filePath: string = '', public desiredState: TStrict extends true ? FileDependencyState : string = FileDependencyState.Active) {
        super();
    }

    isValid(): this is FileDependency<true> {
        return Object.values(FileDependencyState).includes(this.desiredState as any);
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        if (!Object.values(FileDependencyState).includes(this.desiredState as any))
            return {reason: InvalidityReason.DependencyFileInvalidState, offendingValue: this.desiredState, tree};

        return null;
    }

    associateWithDocument(document: Document) {
        return;
    }

    override asElement(document: Document): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        element.setAttribute(AttributeName.File, this.filePath);
        element.setAttribute(AttributeName.State, this.desiredState);

        return element;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): FileDependency<false> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const filePath = element.getAttribute(AttributeName.File) ?? '';
        const desiredState = element.getAttribute(AttributeName.State) ?? FileDependencyState.Active;

        const obj = new FileDependency<false>(filePath, desiredState);
        obj.assignElement(element);
        return obj;
    }

    override decommission: undefined;
}
