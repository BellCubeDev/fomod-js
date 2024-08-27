/**
 * @jest-environment node
 */

import { JSDOM } from 'jsdom';
import { BlankModuleConfig, Fomod, parseModuleDoc } from '..';
import { describe, test, expect } from 'vitest';

test('HTML document is rejected', () => {
    const doc = new JSDOM(BlankModuleConfig, {contentType: 'text/html'}).window.document;
    expect(parseModuleDoc.bind(undefined, doc)).toThrowError('Provided document is not an XML document');
});

test('XML document is accepted', () => {
    const doc = new JSDOM(BlankModuleConfig, {contentType: 'text/xml'}).window.document;
    expect(parseModuleDoc.bind(undefined, doc)).not.toThrow('Provided document is not an XML document');
});
