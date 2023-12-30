import { getOrCreateElementByTagNameSafe } from "../../DomUtils";
import { Group } from "./Group";
import { InvalidityReason, InvalidityReport } from "../lib/InvalidityReporting";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "../lib/XmlRepresentation";
import { AttributeName, SortingOrder, TagName } from "../Enums";
import { FomodDocumentConfig } from "../lib/FomodDocumentConfig";

export class Step<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = TagName.InstallStep;
    readonly tagName = TagName.InstallStep;


    constructor(
        public name: string = '',
        public sortingOrder: TStrict extends true ? SortingOrder : string = SortingOrder.Ascending,
        public groups: Set<Group<TStrict>> = new Set(),
    ) {
        super();
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute(AttributeName.Name, this.name);

        const groupsContainer = getOrCreateElementByTagNameSafe(element, TagName.OptionalFileGroups);

        groupsContainer.setAttribute(AttributeName.Order, this.sortingOrder);
        for (const group of this.groups)  groupsContainer.appendChild(group.asElement(document));

        return element;
    }

    isValid(): this is Step<true> {
        return (
            Object.values(SortingOrder).includes(this.sortingOrder as any) &&
            Array.from(this.groups).every(group => group.isValid())
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        if (!Object.values(SortingOrder).includes(this.sortingOrder as any))
            return { reason: InvalidityReason.StepUnknownGroupSortingOrder, offendingValue: this.sortingOrder, tree };

        for (const group of this.groups) {
            const reason = group.reasonForInvalidity(...tree, this);
            if (reason !== null) return reason;
        }

        return null;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): Step<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const name = element.getAttribute(AttributeName.Name);

        const step = new Step<false>(name ?? '');
        step.assignElement(element);

        const groupsContainer = element.querySelector(TagName.OptionalFileGroups);
        if (groupsContainer === null) return step;

        const sortingOrder = groupsContainer.getAttribute(AttributeName.Order);
        if (sortingOrder !== null) step.sortingOrder = sortingOrder;

        let configForGroups = config;
        if (configForGroups.parseOptionFlags) configForGroups = Object.assign({}, configForGroups, {parseOptionFlags: false});

        for (const groupElement of groupsContainer.querySelectorAll(TagName.Group)) {
            const group = Group.parse(groupElement, configForGroups);
            if (group !== null) step.groups.add(group);
        }

        return step;
    }

    override decommission(currentDocument?: Document | undefined) {
        for (const group of this.groups) group.decommission(currentDocument);
    }
}
