import { InvalidityReason, Verifiable } from "../src";
import { addTo } from "polyfill-pseudoclass-has";

import * as matchers from 'jest-extended';
expect.extend(matchers);

addTo(Element, Document, DocumentFragment);
const parser = new DOMParser();

export function parseTag(literals: TemplateStringsArray, ...expressions: string[]) {
    let str = '';
    literals.forEach((string, i) => {
        str += string + (expressions[i] ?? '');
    });
    const doc = parser.parseFromString(str, 'text/xml');
    return doc.documentElement;
}

/** Ensures the provided Verifiable object is valid. Alternatively, if specified, ensures the provided Verifiable object is invalid and has the specified reason for invalidity.
 *
 * Will check that isValid() and reasonForInvalidity() agree, and that the reasonForInvalidity() matches the expected reason. If a mismatch occurs,
 *
 * @param v
 * @param expectedReason
 */
export function testValidity(v: Verifiable<boolean>, expectedReason?: InvalidityReason) {
    const reason = v.reasonForInvalidity();
    const validity = v.isValid();

    expect(reason).toBe(validity ? null : reason); // Always fail if isValid() and reasonForInvalidity() disagree
    expect(reason?.reason).toBe(expectedReason);
    expect(validity).toBe(!expectedReason);
}
