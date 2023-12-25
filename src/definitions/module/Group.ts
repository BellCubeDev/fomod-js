import { getOrCreateElementByTagNameSafe } from "../../DomUtils";
import { InvalidityReason, InvalidityReport } from "../lib/InvalidityReporting";
import { Option } from "./Option";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "../lib/XmlRepresentation";
import { AttributeName, GroupBehaviorType, SortingOrder, TagName } from "../Enums";

export class Group<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = TagName.Group;
    readonly tagName = TagName.Group;


    constructor(
        public name: string = '',
        public behaviorType: TStrict extends true ? GroupBehaviorType : string = GroupBehaviorType.SelectExactlyOne,
        public sortingOrder: TStrict extends true ? SortingOrder : string = SortingOrder.Ascending,
        public options: Set<Option<TStrict>> = new Set(),
    ) {
        super();
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute(AttributeName.Name, this.name);
        element.setAttribute(AttributeName.Type, this.behaviorType);

        const optionsContainer = getOrCreateElementByTagNameSafe(element, TagName.Plugins);

        optionsContainer.setAttribute(AttributeName.Order, this.sortingOrder);
        for (const option of this.options) optionsContainer.appendChild(option.asElement(document));

        return element;
    }

    isValid(): this is Group<true> {
        return  Object.values(GroupBehaviorType).includes(this.behaviorType as any) &&
                Object.values(SortingOrder).includes(this.sortingOrder as any) &&
                Array.from(this.options).every(option => option.isValid()
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        if (!Object.values(GroupBehaviorType).includes(this.behaviorType as any))
            return { reason: InvalidityReason.GroupUnknownBehaviorType, offendingValue: this.behaviorType, tree };

        if (!Object.values(SortingOrder).includes(this.sortingOrder as any))
            return { reason: InvalidityReason.GroupUnknownOptionSortingOrder, offendingValue: this.sortingOrder, tree };

        for (const option of this.options) {
            const reason = option.reasonForInvalidity(...tree);
            if (reason !== null) return reason;
        }

        return null;
    }

    static override parse(element: Element): Group<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const name = element.getAttribute(AttributeName.Name);
        const behaviorType = element.getAttribute(AttributeName.Type);

        const group = new Group<false>(name ?? '', behaviorType ?? '');
        group.assignElement(element);

        const optionsContainer = element.querySelector(`:scope > ${TagName.Plugins}`);
        if (optionsContainer === null) return group;

        const sortingOrder = optionsContainer.getAttribute(AttributeName.Order);
        if (sortingOrder !== null) group.sortingOrder = sortingOrder;

        for (const optionElement of optionsContainer.querySelectorAll(`:scope > ${TagName.Plugin}`)) {
            const option = Option.parse(optionElement);
            if (option !== null) group.options.add(option);
        }

        return group;
    }

    decommission(currentDocument?: Document) {
        this.options.forEach(option => option.decommission(currentDocument));
    }
}
