import { Fomod, parseModuleDoc } from "../../../src";
import { FomodDocumentConfig } from "../../../src/definitions/lib/FomodDocumentConfig";
import { parseTag } from "../../testUtils";

function getTestElement() {return parseTag`
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://qconsulting.ca/fo3/ModConfig5.0.xsd">
    <moduleName />
    <installSteps>
        <installStep name="" >
            <optionalFileGroups>
                <group name="" type="SelectAtLeastOne">
                    <plugins>
                        <plugin name="" >
                            <description  />
                            <image path="" />
                            <conditionFlags>
                                <flag name="only_flag_for_this_option">OPTION_SELECTED__CUSTOM</flag>
                            </conditionFlags>
                            <typeDescriptor><type name="Required" /></typeDescriptor>
                        </plugin>
                    </plugins>
                </group>
            </optionalFileGroups>
        </installStep>
    </installSteps>


    <conditionalFileInstalls>
        <patterns>

            <!-- Empty -->
            <pattern>
                <dependencies />
                <files />
            </pattern>

            <!-- No Dependencies -->
            <pattern>
                <dependencies />
                <files>
                    <file source="something.md" />
                </files>
            </pattern>

            <!-- Option Dependency -->
            <pattern>
                <dependencies>
                    <flagDependency flag="only_flag_for_this_option" value="OPTION_SELECTED__CUSTOM" />
                </dependencies>
                <files>
                    <file source="something-else.md" />
                </files>
            </pattern>

            <!-- Regular Dependency -->
            <pattern>
                <dependencies>
                    <fileDependency file="Skyrim.esm" state="Active" />
                </dependencies>
                <files>
                    <file source="MySkyrimPlugin.esp" />
                </files>
            </pattern>
        </patterns>
    </conditionalFileInstalls>
</config>`;}


describe('Dependency Parsing Config Options', () => {
    /** [parse] Whether to attempt to determine if a flag is an option flag to the best of our knowledge
     *
     * If `'loose'` is provided, we'll accept any flag name or value so long as it's only set by one option.
     *
     * @default true
    */
    describe('parseOptionFlags', () => {
        test('1=1', ()=>{expect(1).toBe(1)});
    });

    /** [asElement] Whether to move all conditional installs with only a dependency on a single option to the <files> tag of that option
     *
     * Note that this may cause slight performance issues with Vortex on slower machines.
     *
     * @default false
    */
    describe('flattenConditionInstalls', () => {
        const config: FomodDocumentConfig = {
            flattenConditionalInstalls: true,
            parseOptionFlags: true,
            optionSelectedValue: 'OPTION_SELECTED__CUSTOM',

            removeEmptyConditionalInstalls: false,
        };

        const existingEl = getTestElement();
        const obj = Fomod.parse(existingEl, config);
        obj.asElement(existingEl.ownerDocument, config);
        const cleanEl = obj.asElement(parseTag`<p/>`.ownerDocument!, config);

        it('should have only removed one conditional install', () => {
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(3);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(3);
        });

        it('should have moved the files from the removed conditional install to the option', () => {
            expect(cleanEl.querySelectorAll(':scope > installSteps > installStep > optionalFileGroups > group > plugins > plugin > files > file').length).toBe(1);
            expect(existingEl.querySelectorAll(':scope > installSteps > installStep > optionalFileGroups > group > plugins > plugin > files > file').length).toBe(1);
        });

        it('moved the correct install', () => {
            expect(cleanEl.querySelectorAll(':scope > installSteps > installStep > optionalFileGroups > group > plugins > plugin > files > file[source="something-else.md"]').length).toBe(1);
            expect(existingEl.querySelectorAll(':scope > installSteps > installStep > optionalFileGroups > group > plugins > plugin > files > file[source="something-else.md"]').length).toBe(1);
        });
    });

    /** [asElement] Whether to reorganize all conditional installs with no dependencies into the <requiredInstallFiles> tag
     *
     * @default false
    */
    describe('flattenConditionalInstallsNoDependencies', () => {
        const config = {
            flattenConditionalInstallsNoDependencies: true,
            removeEmptyConditionalInstalls: false,
        };

        const existingEl = getTestElement();
        const obj = Fomod.parse(existingEl, config);
        obj.asElement(existingEl.ownerDocument, config);
        const cleanEl = obj.asElement(parseTag`<p/>`.ownerDocument!, config);

        it('should have removed two conditional installs', () => { // because the empty one also has no deps by way of being empty
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(2);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(2);
        });

        it('should have moved the files to <requiredInstallFiles>', () => {
            expect(cleanEl.querySelectorAll(':scope > requiredInstallFiles > file').length).toBe(1);
            expect(existingEl.querySelectorAll(':scope > requiredInstallFiles > file').length).toBe(1);
        });
    });


    /** [asElement] Whether to remove conditional installs with no dependencies and no files (has no effect when `flattenConditionalInstallsNoDependencies` is `true`)
     *
     * @default true
    */
    describe('removeEmptyConditionalInstalls', () => {
        const config = {
            removeEmptyConditionalInstalls: true,
        };

        const existingEl = getTestElement();
        const obj = Fomod.parse(existingEl, config);
        obj.asElement(existingEl.ownerDocument, config);
        const cleanEl = obj.asElement(parseTag`<p/>`.ownerDocument!, config);

        it('should have removed one conditional install', () => {
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(3);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern').length).toBe(3);
        });

        it('removed the correct install', () => {
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern:not(:has(dependencies > *)):has(files > *)').length).toBe(1);
            expect(cleanEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern:not(:has(dependencies > *)):not(:has(files > *))').length).toBe(0);

            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern:not(:has(dependencies > *)):has(files > *)').length).toBe(1);
            expect(existingEl.querySelectorAll(':scope > conditionalFileInstalls > patterns > pattern:not(:has(dependencies > *)):not(:has(files > *))').length).toBe(0);
        });
    });
});

