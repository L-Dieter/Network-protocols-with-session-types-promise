import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Server } from "../../classes/serverBase";
import { WebSocket } from "ws";

// the session for a server to create a quiz
const session: Session = {
    kind: "def", name: "loop", cont: {
        kind: "choice", dir: "recv", alternatives: {
            "AddQuestion": { kind: "single", dir: "recv", payload: { type: "string" }, cont: {
                kind: "ref", name: "loop"
            }},
            "AddOptions": { kind: "single", dir: "recv", payload: { type: "array", payload: { type: "union", components: [{ type: "string" }, { type: "number" }, { type: "bool" }] } }, cont: {
                kind: "single", dir: "recv", payload: { type: "number" }, cont: {
                    kind: "ref", name: "loop"
                }
            }},
            "Quit": { kind: "single", dir: "send", payload: { type: "array", payload: { type: "record", payload: {
                        "question": { type: "string"},
                        "options": { type: "array", payload: { type: "union", components: [{ type: "string" }, { type: "number" }, { type: "bool" }] } },
                        "solutionIndex": { type: "number" }
                    }
                }
            }, cont: { kind: "end" }}
        }
    }
}

// create the config to initialize a server
export const configQuizServer: Config = mkConfig(session);

// a server to add a question and options to a quiz
export class QuizServer extends Server {
    
    question: string;
    // options: { question: string, answer: string | boolean}[];
    options: (string|number|boolean)[];
    solutionIndex: number;
    quiz: { question: string, options: (string|number|boolean)[], solutionIndex: number}[];

    // initialize all values needed and call the superclass
    constructor(session: Session, socket: WebSocket) {
        super(session, socket);
        this.question = "";
        this.options = [];
        this.solutionIndex = -1;
        this.quiz = [];
    }

    // add a new question
    addQuestion = async () : Promise<boolean> => {
        this.question = await this.receive();
        return true;
    }

    // add the options for a given question and store them
    addOptions = async () : Promise<boolean> => {
        this.options = await this.receive();
        this.solutionIndex = await this.receive();
        this.quiz.push({ question: this.question, options: this.options, solutionIndex: this.solutionIndex});
        return true;
    }

    // quit the program
    quit = async () : Promise<boolean> => {
        return false;
    }

    // add something new or send the quiz to the client and close the connection
    start = async () : Promise<void> => {
        let r: boolean;
        do {
            r = await this.choice({
                "AddQuestion": this.addQuestion,
                "AddOptions": this.addOptions,
                "Quit": this.quit
            })
        } while (r);
        await this.send(this.quiz);
        await this.close();
    }
}
