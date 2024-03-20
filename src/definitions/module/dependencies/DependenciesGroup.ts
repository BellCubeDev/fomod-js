import { Dependency } from ".";
import { AttributeName, DependencyGroupOperator, TagName } from "../../Enums";
import { ElementObjectMap, InvalidityReason, InvalidityReport, Verifiable } from "../../lib";
import { FomodDocumentConfig } from "../../lib/FomodDocumentConfig";
import type { Option } from "../Option";


type DependencyTagName = TagName.Dependencies|TagName.ModuleDependencies|TagName.Visible;

export class DependenciesGroup<TTagName extends DependencyTagName, TStrict extends boolean> extends Dependency {
    static override readonly tagName = [TagName.Dependencies, TagName.ModuleDependencies, TagName.Visible] as [TagName.Dependencies, TagName.ModuleDependencies, TagName.Visible];

    constructor(
        public readonly tagName: TTagName,
        public operator: TStrict extends true ? DependencyGroupOperator : string = DependencyGroupOperator.And,
        public dependencies: Set<Dependency<TStrict>> = new Set()
    ) {
        super();
    }

    isValid(): this is DependenciesGroup<TTagName, true> {
        return  Object.values(DependencyGroupOperator).includes(this.operator as any) &&
                Array.from(this.dependencies).every(d => d.isValid());
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);

        if (!Object.values(DependencyGroupOperator).includes(this.operator as any))
            return {reason: InvalidityReason.DependenciesUnknownOperator, offendingValue: this.operator, tree};

        for (const dependency of this.dependencies) {
            const reason = dependency.reasonForInvalidity(...tree);
            if (reason) return reason;
        }

        return null;
    }

    associateWithDocument(document: Document) {
        this.dependencies.forEach(d => d.associateWithDocument?.(document));
    }

    override asElement(document: Document, config: FomodDocumentConfig = {}, knownOptions: Option<boolean>[] = []): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        element.setAttribute(AttributeName.Operator, this.operator);

        for (const dependency of this.dependencies)
            element.appendChild(dependency.asElement(document, config, knownOptions));

        return element;
    }

    static override parse<TTagName extends DependencyTagName = DependencyTagName>(element: Element, config: FomodDocumentConfig = {}): DependenciesGroup<TTagName, false> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const tagName = element.tagName as TTagName;
        const operator = element.getAttribute(AttributeName.Operator) ?? DependencyGroupOperator.And;
        const dependencies = Array.from(element.children).map(e => Dependency.parse(e, config)).filter((d): d is Dependency<false> => d !== null);

        const obj = new DependenciesGroup<TTagName, false>(tagName, operator, new Set(dependencies));
        obj.assignElement(element);
        return obj;
    }

    override decommission(currentDocument?: Document) {
        this.dependencies.forEach(d => d.decommission?.(currentDocument));
    }
}
