import { Type } from "../../protocol";

// generates a schema for the disired type structure
export function generateSchema (type: Type): JSON {

    let schemaString: string = JSON.stringify(type);

    try {

        // rename 'any' type because of the representation in the schema type
        schemaString = schemaString.replace(/\"type\":\"any\"/g, "");

        // rename bool because of the schema type
        schemaString = schemaString.replace(/bool/g, "boolean");

        // rename the array types
        schemaString = schemaString.replace(/array\",\"payload/g, "array\",\"minItems\":1,\"items");
        schemaString = schemaString.replace(/tuple\",\"payload\"/g, "array\",\"minItems\":1,\"items\":false,\"prefixItems\"");
        schemaString = schemaString.replace(/type\":\"union\",\"components/g, "oneOf");

        // rename object types
        schemaString = schemaString.replace(/record\",\"payload/g, "object\",\"additionalProperties\": false,\"properties");

        // add "required" to the object
        const recordProperties: string[] = schemaString.match(/\"properties.+?\}\}/g) || [];
        for (var rec of recordProperties) {

            let recStr: string = rec.replace(/(.*)/, "{$1}");
            const recObj: Record<string, object> = JSON.parse(recStr);
            schemaString = schemaString.replace(rec, `\"required\":${JSON.stringify(Object.keys(recObj.properties))},${rec}`);

        }

        // rename ref and def types
        schemaString = schemaString.replace(/type\":\"def\",\"name\":/g, "$defs\":{");
        schemaString = schemaString.replace(/type\":\"ref\",\"name\":\"/g, "$ref\":\"#/$defs/");

        // add as many "}" as needed to close out the def
        const singleDef: string[] = schemaString.match(/(defs\".+?\})/g) || [];
        for (var single of singleDef) {
            const numberDefs: number = single.match(/defs/g)?.length || 1;
            if (!single.match(/\[/g)) {
                schemaString = schemaString.replace(single, `${single}${"}".repeat(numberDefs)}`);
            }
        }

        // check for nested defs inside squared brackets and add "}" at the right place
        const nestedDef: string[] = schemaString.match(/(defs\".+?\])/g) || [];
        for (var nested of nestedDef) {
            const openSqBrackets: number = nested.match(/\[/g)?.length || 1;
            const re: RegExp = new RegExp(`(defs.+?\])((.*?\]){${openSqBrackets-1}})`);
            schemaString = schemaString.replace(re, "$1$2}");
        }
        
        // remove last occurrences of "payload" in the def types
        schemaString = schemaString.replace(/,\"payload\"/g, "");

        // remove unwanted stuff
        schemaString = schemaString.replace(/,\"name\":\".+?\"/g, "");

    } catch (error) {
        console.error("Failed generating the Schema: ", error);
    }

    const newSchema: JSON = JSON.parse(schemaString);

    return newSchema;
}