
export async function parseXML(content) {
  const fastXmlParser = await eval("import('fast-xml-parser')");
  const parser = new fastXmlParser.XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  return parser.parse(content);
}
