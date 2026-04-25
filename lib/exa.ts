import Exa from "exa-js";

let _exa: Exa | null = null;

export function getExa(): Exa {
  if (!_exa) {
    if (!process.env.EXA_API_KEY) {
      throw new Error("EXA_API_KEY environment variable is not set");
    }
    _exa = new Exa(process.env.EXA_API_KEY);
  }
  return _exa;
}
