
import { XMLParser } from "fast-xml-parser";

export function parseXML(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    parseTagValue: true,
  });

  const result = parser.parse(xmlString);
  console.log("🧪 Raw parsed object:", JSON.stringify(result, null, 2));
  return result;
}
