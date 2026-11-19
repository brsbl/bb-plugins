declare module "jsdom" {
  type DOMWindow = Window & typeof globalThis;
  export class JSDOM {
    constructor(
      html: string,
      options?: { runScripts?: "dangerously" | "outside-only"; pretendToBeVisual?: boolean; beforeParse?: (window: DOMWindow) => void },
    );
    readonly window: DOMWindow;
  }
}
