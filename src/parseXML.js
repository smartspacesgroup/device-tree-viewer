
import { XMLParser } from 'fast-xml-parser';

export async function parseXML(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  return parser.parse(xmlString);
}
