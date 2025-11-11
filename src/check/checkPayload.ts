import { Type } from "../../protocol";
import { compileSchema } from "json-schema-library";
import { generateSchema } from "../misc/typeToSchema";

// check if the input and a payload type fit together
export function checkPayload (input: JSON, type: Type, markers: { "name": string, "type": Type}[] = []): boolean {

    let valid_payload: boolean = false;
    let markerDB: { "name": string, "type": Type}[] = markers;

    switch (type.type) {
        case "ref": {

            // check if name exists (fail if it does not)
            for (const marker of markerDB) {
                if (type.name === marker.name) {
                    valid_payload = checkPayload(input, marker.type);
                    break;
                }
            }
            break;
        }
        case "def": {

            // check if the name exists already
            for (let marker of markerDB) {
                if (marker.name === type.name) {
                    return false;
                }
            }

            // safe the "name -> type" of the def
            markerDB.push({ "name": type.name, "type": type.payload});

            valid_payload = checkPayload(input, type.payload, markerDB);

            break;
        }
        default: {
            const schema: JSON = generateSchema(type);
            const { valid, errors } = compileSchema(schema).validate(input);
            valid_payload = valid;
        } 
        
    }

    return valid_payload;
    
}
