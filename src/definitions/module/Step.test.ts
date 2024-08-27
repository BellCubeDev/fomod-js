import { DependenciesGroup, DependencyGroupOperator, FileDependency, FileDependencyState, SortingOrder, Step, TagName } from "../..";
import { parseTag, testValidity } from "../../tests/testUtils";
import { describe, test, expect, beforeAll } from 'vitest';

describe('Basic Step', () => {
    const step = new Step<true>('apple', SortingOrder.Explicit);

    test('Name Is Correct', () => expect(step.name).toBe('apple'));
    test('Sorting Order Is Correct', () => expect(step.sortingOrder).toBe(SortingOrder.Explicit));
    test('Groups Are Empty', () => expect(step.groups.size).toBe(0));
    test('Visibility Dependencies Are Empty', () => expect(step.visibilityDeps.dependencies.size).toBe(0));
    test('Is Valid', () => expect(step.isValid()).toBe(true));
    test('Reason For Invalidity Is Null', () => expect(step.reasonForInvalidity()).toBeNull());

    describe('Generate Element', () => {
        expect(() => step.asElement(parseTag`<p />`.ownerDocument)).not.toThrow();

        let element: Element;
        beforeAll(() => {element = step.asElement(parseTag`<p />`.ownerDocument)});

        test('Element Is Correct', () => expect(element.tagName).toBe(TagName.InstallStep));
        test('Name Attribute Is Correct', () => expect(element.getAttribute('name')).toBe('apple'));
        test('Sorting Order Attribute Is Correct', () => expect(element.getElementsByTagName(TagName.OptionalFileGroups).item(0)?.getAttribute('order')).toBe(SortingOrder.Explicit));
        test('Visibility Dependencies Element Is Not Present', () => expect(element.querySelector(TagName.Visible)).toBeNull());
        test('Groups Element Is Present', () => expect(element.querySelector(TagName.OptionalFileGroups)).not.toBeNull());
    });
});

test('Step With Visibility Conditions Can Serialize In-Place', () => {
    const stepElement = parseTag`
        <${TagName.InstallStep} name="apple" order="Explicit">
            <${TagName.Visible}>
                <${TagName.FileDependency} name="banana" state="Present" operator="And" />
            </visible>
        </installStep>
    `
    const step = Step.parse(stepElement);

    expect(step.isValid()).toBe(true);
    expect(step.reasonForInvalidity()).toBeNull();
    expect(()=>step.asElement(stepElement.ownerDocument)).not.toThrow();
});
