import { request } from './client';

export interface TemplateConfig {
    name: string;
    tags: string[];
    colors: {
        text: string;
        bg: string;
    };
}

export async function getTemplates(): Promise<TemplateConfig[]> {
    return request<TemplateConfig[]>('/meta/templates');
}
