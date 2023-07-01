/**
 * @jest-environment node
 */

import { JSDOM } from 'jsdom';
import { parseInfoDoc, parseModuleDoc } from '../src/parse';
import { Fomod, FomodInfo } from '../src';

const moduleDoc = new JSDOM(`<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://qconsulting.ca/fo3/ModConfig5.0.xsd">
<moduleName>The BANANA Mod</moduleName>
<moduleImage path="fomod\\images\\banana.jpg" showImage="true" />

<moduleDependencies operator="And">
    <fileDependency file="textures\\da08ebonykey.dds" state="Active" />
    <fileDependency file="textures\\da08ebonykey.dds" state="Inactive" />
    <fileDependency file="textures\\da08ebonykey.dds" state="Missing" />

    <flagDependency flag="" value="" />

    <fommDependency version="" />
    <foseDependency version="" />
    <gameDependency version="" />

    <dependencies></dependencies>
</moduleDependencies>

<requiredInstallFiles>

</requiredInstallFiles>

<installSteps>
    <installStep name="THE FIRST OF MANY STEPS" >
        <optionalFileGroups order="Explicit">


            <group name="Banana Types" type="SelectAny">
                <plugins order="Explicit">

                    <plugin name="1700s">
                        <description>Bananas from the 1700s were vastly different from what we see on the shelves today!</description>
                        <image path="123" />
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <files>
                            <file source="banana" alwaysInstall="true" />
                            <file source="banana2" destination="dest/banana2" installIfUsable="false" priority="95" />
                        </files>
                        <typeDescriptor><type name="Required" /></typeDescriptor>
                    </plugin>

                    <plugin name="Australian">
                        <description>Nobody knows why, but Australia has some WEIRD bananas.</description>
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="Recommended" /></typeDescriptor>
                    </plugin>

                    <plugin name="Modern Worldwide">
                        <description>Ah, the modern Cavendish banana! How not-sweet it tastes! Do yourself a favor and get one from the 1700s.</description>
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="Optional" /></typeDescriptor>
                    </plugin>

                    <plugin name="Purple Bananas">
                        <description>~~CENSORED~~</description>
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="CouldBeUsable" /></typeDescriptor>
                    </plugin>

                    <plugin name="Brown Bananas">
                        <description>Sorry, but you can't have feces.</description>
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="NotUsable" /></typeDescriptor>
                    </plugin>

                </plugins>
            </group>


            <group name="Banana Textures" type="SelectExactlyOne">
                <plugins order="Explicit">

                    <plugin name="Base 1024x1024">
                        <description>These textures are used for anything we didn't downscale/upscale.</description>
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="Required" /></typeDescriptor>
                    </plugin>

                    <plugin name="2048x2048">
                        <description>2K is a comfortable resolution fot banana textures.</description>
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="Recommended" /></typeDescriptor>
                    </plugin>

                    <plugin name="4096x4096">
                        <description>4K might be a bit over the top, but hey.</description>
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="Optional" /></typeDescriptor>
                    </plugin>

                    <plugin name="128x128">
                        <description>Looks awful.</description>
                        <image path="" />
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="CouldBeUsable" /></typeDescriptor>
                    </plugin>

                    <plugin name="0x0">
                        <description>Just... don't install the mod.</description>
                        <conditionFlags><flag name="1">1</flag></conditionFlags>
                        <typeDescriptor><type name="NotUsable" /></typeDescriptor>
                    </plugin>

                </plugins>
            </group>

            <group name="123" type="SelectAtLeastOne">
                <plugins>
                    <plugin name="123">
                        <description></description>
                        <files></files>
                        <typeDescriptor>

                            <dependencyType>
                                <defaultType name="Required" />
                                <patterns>
                                    <pattern>
                                        <dependencies></dependencies>
                                        <type name="Required" />
                                    </pattern>
                                </patterns>
                            </dependencyType>
                        </typeDescriptor>
                    </plugin>
                </plugins>
            </group>


        </optionalFileGroups>
    </installStep>
</installSteps>

<conditionalFileInstalls>
    <patterns>
        <pattern>
            <dependencies operator="And">
                <fileDependency file="" state="Missing"  />
            </dependencies>
            <files>
                <file source="" priority="0"  />
                <folder source="" />
            </files>
        </pattern>
    </patterns>
</conditionalFileInstalls>

</config>`, { contentType: 'text/xml' } ).window.document;


describe('Info.xml Got Parsed', () => {
    const infoDoc =  new JSDOM(`<fomod xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://bellcubedev.github.io/site-testing/assets/site/misc/Info.xsd">
        <Name>The BANANA Mod</Name>
        <Author>BellCube</Author>
        <Id>1</Id>
        <Website>https://example.com</Website>
        <Version>1.0.0</Version>
    </fomod>`, {contentType: 'text/xml'}).window.document;

    const infoObj = parseInfoDoc(infoDoc);

    expect(infoObj).toBeInstanceOf(FomodInfo);
    if (!infoObj) return;

    test('Name Is Correct', () => {
        expect(infoObj.data.Name).toBe('The BANANA Mod');
    });

    test('Author Is Correct', () => {
        expect(infoObj.data.Author).toBe('BellCube');
    });

    test('Id Is Correct', () => {
        expect(infoObj.data.Id).toBe('1');
    });

    test('Website Is Correct', () => {
        expect(infoObj.data.Website).toBe('https://example.com');
    });

    test('Version Is Correct', () => {
        expect(infoObj.data.Version).toBe('1.0.0');
    });

    describe('Converted Back Into Element Properly', () => {
        const newElement = infoObj.asElement(new JSDOM('<config />', {contentType: 'text/xml'}).window.document);

        test('Main Element Has Correct Tag Name', () => {
            expect(newElement.tagName).toBe('fomod');
        });

        test('Name Element Has Correct Tag Name', () => {
            expect(newElement.querySelector('Name')?.tagName).toBe('Name');
        });

        test('Name Element Has Correct Text Content', () => {
            expect(newElement.querySelector('Name')?.textContent).toBe('The BANANA Mod');
        });
    });
});



const moduleObj = parseModuleDoc(moduleDoc);

test('Parse ModuleConfig.xml', () => {
    expect(moduleObj).toBeInstanceOf(Fomod);
});
