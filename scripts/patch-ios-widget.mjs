import { readFileSync, writeFileSync } from 'node:fs';

const pbxprojPath = 'ios/App/App.xcodeproj/project.pbxproj';
let content = readFileSync(pbxprojPath, 'utf8');

// Generate deterministic pseudo-UUIDs based on file name
function makeUuid(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const hex = (0x5000000000000000n + BigInt.asUintN(64, BigInt(h))).toString(16).padStart(24, '0');
  return hex.slice(0, 8) + hex.slice(8, 12) + hex.slice(12, 16) + hex.slice(16, 20) + hex.slice(20, 32);
}

const fileRefUuid = makeUuid('WidgetPlugin.swift fileref');
const buildFileUuid = makeUuid('WidgetPlugin.swift buildfile');

// 1. Add PBXFileReference for WidgetPlugin.swift
const fileRefLine = '\t\t' + fileRefUuid + ' /* WidgetPlugin.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = WidgetPlugin.swift; sourceTree = "<group>"; };\n';
const fileRefEndMarker = '/* End PBXFileReference section */';
if (!content.includes('WidgetPlugin.swift')) {
  content = content.replace(fileRefEndMarker, fileRefLine + fileRefEndMarker);
}

// 2. Add PBXBuildFile for WidgetPlugin.swift
const buildFileLine = '\t\t' + buildFileUuid + ' /* WidgetPlugin.swift in Sources */ = {isa = PBXBuildFile; fileRef = ' + fileRefUuid + ' /* WidgetPlugin.swift */; };\n';
const buildFileEndMarker = '/* End PBXBuildFile section */';
if (!content.includes('WidgetPlugin.swift in Sources')) {
  content = content.replace(buildFileEndMarker, buildFileLine + buildFileEndMarker);
}

// 3. Add fileRef to App group (PBXGroup children)
const appGroupMarker = '504EC3131FED79650016851F /* Info.plist */,';
const groupAdd = '\t\t\t\t' + fileRefUuid + ' /* WidgetPlugin.swift */,';
if (!content.includes(groupAdd)) {
  content = content.replace(appGroupMarker, appGroupMarker + '\n' + groupAdd);
}

// 4. Add buildFile to Sources build phase
const sourcesMarker = '504EC3081FED79650016851F /* AppDelegate.swift in Sources */,';
const sourceAdd = '\t\t\t\t' + buildFileUuid + ' /* WidgetPlugin.swift in Sources */,';
if (!content.includes(sourceAdd)) {
  content = content.replace(sourcesMarker, sourcesMarker + '\n' + sourceAdd);
}

writeFileSync(pbxprojPath, content);
console.log('[patch-ios-widget] Added WidgetPlugin.swift to App target in project.pbxproj');
