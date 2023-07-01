# fomod
A JavaScript/TypeScript library for working with FOMOD installers both in the browser and in Node (via [jsdom](https://github.com/jsdom/jsdom))

> [!IMPORTANT]
> You MUST make sure that any Document you provide uses a valid XML `contentType`, e.g. `'text/xml'`. This is enforced at multiple levels for your own safety. The DOM behaves differently between the XML and HTML implementations and this can cause unexpected issues with Fomod installers.
>
> <details> <summary>How Do I Do This?</summary>
> <h3>Browser</h3>
>
> ```ts
> import { BlankModuleConfig } from 'https://unpkg.com/fomod';
>
> const parser = new DOMParser()
>
> parser.parseFromString(BlankModuleConfig, 'text/xml')
> ```
>
> ### jsdom
> ```ts
> import { BlankModuleConfig } from 'fomod';
> import { JSDOM } from 'jsdom';
>
> new JSDOM(BlankModuleConfig, {contentType: 'text/xml'});
> ```

</details>

<details>
    <summary><span><h2>What Is a FOMOD</h2></span></summary>

FOMOD, or `F`all`O`ut `MOD`, is a confusingly-named file installer format pioneered by Fallout Mod Manager (FOMM). The goal of the format is to present users with options to be taken into account when installing the mod. It's primarily used in the Bethesda modding scene, though it's typically supported for use with any game a given mod manager supports. While FOMM, Nexus Mod Manager, and Vortex all supported writing a .NET installer (called a "scripted installer"), it's very rarely observed in use in the wild. With that and the security threat that comes with arbitrary code execution, most mod managers forego its support (Nexus Mod Manager and Vortex have both supported it, though).

FOMOD installers are therefore nearly always written in the alternative, a [schema](https://qconsulting.ca/fo3/ModConfig5.0.xsd)-compliant XML file. This XML format is a little burdensome and a lot XML, so tools have popped up over the years to simplify their creation. Namely, GandaG's [FOMOD Designer](https://github.com/GandaG/fomod-designer/)—a direct 1-to-1 editor and representation of the XML tree—and the [FOMOD Creation Tool](https://www.nexusmods.com/fallout4/mods/6821/), a more abstract and arguably more user-friendly representation of the installer format. In development is the [Fomod Builder](https://github.com/BellCubeDev/fomod-builder), an attempt at meeting both in the middle by providing full schema-allowed control, helpful tooltips, a dark-mode UI, built-in mod manager previews & editor styles, and encouraging users to poke around in the XML as they use the tool.

</details>

<details>
    <summary><span><span><h3>Quick terminology breakdown</h3></span> (I chose better names)</span></summary>

|  Term Used  | Canonical Name | What It Refers To |
|     :-:     |       :-:      |        :--        |
|   Install   |       File     | Files and folders that might be installed by the FOMOD |
|   Step      |  Install Step  | A bundle of Groups presented as a single page |
|   Groups    |       Group    | A bundle of checkboxes or radio buttons presented as a section with a header |
|   Options   |      Plugins   | A single checkbox or radio button |

</details>

<br>

## What This Library Does

`fomod` is a library to parse, create, and edit FOMOD installers. It includes:


* Full support for the FOMOD specification
* Bundled type declarations
* Written in TypeScript and thoroughly unit-tested
* Helpful JSDoc comments detailing:
    * Usage
    * Quirks
    * Mod Manager Support
    * Defacto Deprecation
* Create New Installers & Components
* Parse Existing Installers & Components
* In-place editing of existing documents, be they from the native browser or jsdom.
    * You can force a fresh start by passing an empty `Document` object
      > [!IMPORTANT]
      > Documents will need to be explicitly decommissioned to prevent memory leaks when using large numbers of documents or allowing users to arbitrarily create them
* Dependencies on Options (via flags)
    * Options can be used as dependency within the codebase and are converted to a flag dependency when an XML document is produced
* Automatic Install Optimization (required for technical reasons)

### Wait, what's this "Automatic Install Optimization" business?

As someone who used to use Vortex on a slower machine, I've noticed significant performance issues with installers which specified their installs (files and folders to install) directly in the option. As such, I've designed a way around this—using conditional installs. In combination with dependencies on options, this will have no impact on the functionality of your existing FOMODs and is entirely safe to use. The only noteworthy downside is the readability of the resulting XML.

Unfortunately, due to complications with how installs are represented on a technical level, there is currently no option to use the Files option directly. This likely will be addressed in a future release of the library.

> [!NOTE]
> This feature is not yet available. This will be available before the first stable release.

<br>

## Why This Library Exists

Despite its age, the FOMOD format is incredibly popular and serves most everyone's needs. I wasn't a particular fan of the tooling, however—I found the existing solutions rather janky and unintuitive—and set out to create tooling of my own. I first attempted to write it in pure JavaScript, but I learned over time how foolish of an idea that was. I've since learned the error of my ways and written this here library. I intent to [write a static Next.js site](https://github.com/BellCubeDev/fomod-builder) to host [a revised FOMOD Builder](https://fomod.bellcube.dev) using this very library.

<br>

## As A Developer

If you're looking to use this library, this section will be your best friend.

At its core, each data structure (steps, options, installs, dependencies, etc.) is represented by a class.

If you're already familiar with the XML structure, each class generally represents one or two levels of element. For instance, the Option class represents the `<plugin>` container and the `<description>` tag. This is done to reduce the amount of boilerplate you as a developer need to write.

###

This associates the element with this document! For most classes, this is free of side effects. For most classes, the element-document map does not restrict garbage collection. However, with certain classes (e.g. FlagInstance), this can lead to memory leaks. To prevent this, you can call the decommission method on the class.

The easiest way to make sure you're covered, especially between updates, is to always decommission the document (or class) when you're done with it. The `decommission` method is recursive; therefore, you should call it on the highest level class(es) you have access to. Typically, these will be `fomod` and `fomodInfo`.

### Examples

#### Parsing an Existing Installer

<details>
    <summary>In Node, here's how you might go about parsing an existing Fomod installer:</summary>

```ts
import { parseInfoDoc, parseModuleDoc } from 'fomod';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';

// ModuleConfig.xml

const moduleText = await fs.readFile('path/to/ModuleConfig.xml');
const moduleDoc = new JSDOM(moduleText, {contentType: 'text/xml'});
const installer = parseModuleDoc(moduleDoc.window.document)

// Info.xml

const infoText = await fs.readFile('path/to/Info.xml');
const infoDoc = new JSDOM(infoText, {contentType: 'text/xml'});
const metadata = parseModuleDoc(infoDoc.window.document)
```

Or, for a more optimized example:
```ts
import { parseInfoDoc, parseModuleDoc } from 'fomod';
import { JSDOM } from 'jsdom';

const [installer, metadata] = Promise.all([
    JSDOM.fromFile('path/to/ModuleConfig.xml').then((dom) => parseModuleDoc(dom.window.document)),
    JSDOM.fromFile('path/to/Info.xml').then((dom) => parseInfoDoc(dom.window.document)),
]);
```

</details>

#### Creating a New Installer

<details>
    <summary>Creating a brand-new installer with this library is a breeze—you don't even need a document yet! Here's a quick example:</summary>

```ts
import { Fomod, FomodInfo, Step, SortingOrder, Group, GroupBehaviorType, Option } from 'fomod';

// ModuleConfig.xml

const module = new Fomod(`Superfluous and Obnoxious Snow`);

const onlyStep = new Step(`Superfluous and Obnoxious Snow`, SortingOrder.Explicit);
module.steps.add(onlyStep);

const snowColor = new Group('Snow Color', GroupBehaviorType.SelectExactlyOne);
onlyStep.groups.add(snowColor);

const snowColorWhite = new Option('White', 'Snow will be wonderfully white', 'fomod/images/snow_color/white.png');
snowColor.options.add(snowColorWhite);
const snowColorBlue = new Option('Blue', 'Snow will be blindly blue', 'fomod/images/snow_color/blue.png');
snowColor.options.add(snowColorBlue);
const snowColorRed = new Option('Red', 'Snow will be ridiculously red', 'fomod/images/snow_color/red.png');
snowColor.options.add(snowColorRed);
const snowColorGreen = new Option('Green', 'Snow will be gloriously green', 'fomod/images/snow_color/green.png');
snowColor.options.add(snowColorGreen);

const snowAmount = new Group('Snow Amount', GroupBehaviorType.SelectExactlyOne);
onlyStep.groups.add(snowAmount);

const snowAmountLight = new Option('Light', 'Snow will be lightly laid', 'fomod/images/snow_amount/light.png');
snowAmount.options.add(snowAmountLight);
const snowAmountMedium = new Option('Medium', 'Snow will be moderately made', 'fomod/images/snow_amount/medium.png');
snowAmount.options.add(snowAmountMedium);
const snowAmountHeavy = new Option('Heavy', 'Snow will be heavily heaped', 'fomod/images/snow_amount/heavy.png');
snowAmount.options.add(snowAmountHeavy);
const snowAmountBlizzard = new Option('Blizzard', 'Snow will be blizzardly blustered', 'fomod/images/snow_amount/blizzard.png');
snowAmount.options.add(snowAmountBlizzard);

// Info.xml

const info = new FomodInfo({
    Name: 'Superfluous and Obnoxious Snow',
    Author: 'BellCube',
    Id: '8311',
    Version: '6.6.6',
    Website: 'https://bellcube.dev/mods/superfluous-and-obnoxious-snow'
});
```

</details>

#### Cleaning Up

<details>
    <summary>When you're done with a document, you'll want to clean it up. Here's how:</summary>

```ts
import { Fomod } from 'fomod';

// you can refer to the previous examples for how you might get a Fomod instance
declare const module: Fomod;

const thatOneDocument = document.implementation.createDocument(null, null, null);

// Associate the document with the Fomod instance
console.log(module.asElement(thatOneDocument));

// We're done with the document, so let's clean it up
module.decommission(thatOneDocument);

```

</details>
