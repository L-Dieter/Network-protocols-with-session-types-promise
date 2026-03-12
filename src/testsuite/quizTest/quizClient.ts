import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Client } from "../../classes/clientBase";

// the session for a client to create a quiz
const session: Session = {
    kind: "def", name: "loop", cont: {
        kind: "choice", dir: "send", alternatives: {
            "AddQuestion": { kind: "single", dir: "send", payload: { type: "string" }, cont: {
                kind: "ref", name: "loop"
            }},
            "AddOptions": { kind: "single", dir: "send", payload: { type: "array", payload: { type: "union", components: [{ type: "string" }, { type: "number" }, { type: "bool" }] } }, cont: {
                kind: "single", dir: "send", payload: { type: "number" }, cont: {
                    kind: "ref", name: "loop"
                }
            }},
            "Quit": { kind: "single", dir: "recv", payload: { type: "array", payload: { type: "record", payload: {
                        "question": { type: "string"},
                        "options": { type: "array", payload: { type: "union", components: [{ type: "string" }, { type: "number" }, { type: "bool" }] } },
                        "solutionIndex": { type: "number" }
                    }
                }
            }, cont: { kind: "end" }}
        }
    }
}

// create the config to initialize a client
export const configQuizClient: Config = mkConfig(session);

// a client to add a question and options to a quiz
export class QuizClient extends Client {

    quiz: { question: string, options: any[], solutionIndex: number}[];

    constructor() {
        super(configQuizClient);
        this.quiz = [];
    }

    // add a new question
    addQuestion = async (question: string) : Promise<void> => {
        await this.select("AddQuestion");
        await this.send(question);
    }

    // add options to a question and store the data together with an index of the right answer
    addOptions = async (opt: (string|number|boolean)[], solutionIndex: number) : Promise<void> => {
        await this.select("AddOptions");
        await this.send(opt);
        await this.send(solutionIndex);
    }

    // quit the connection and return the data of the quiz
    quit = async () : Promise<{ question: string, options: any[], solutionIndex: number}[]> => {
        await this.select("Quit");
        this.quiz = await this.receive();
        await this.close();
        return this.quiz;
    }

}
