export type RenderData = Record<string, string | number | boolean | null | undefined | object>;

export interface FrontendAPI {
    registerTemplatePath: (path: string) => void;
    renderTemplate: (template: string, data?: RenderData) => string;
}