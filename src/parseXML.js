
import { XMLParser } from "fast-xml-parser";

export function parseXML(content) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  return parser.parse(content);
}
