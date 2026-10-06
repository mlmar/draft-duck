const SITE_URL = 'https://mlmar.github.io/draft-duck';

type SeoOptions = {
    title: string;
    description: string;
    path: string;
    noIndex?: boolean;
};

export function seoMeta({ title, description, path, noIndex = false }: SeoOptions) {
    const url = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;

    return {
        meta: [
            { title },
            { name: 'description', content: description },
            ...(noIndex ? [{ name: 'robots', content: 'noindex,follow' }] : []),
            { property: 'og:type', content: 'website' },
            { property: 'og:site_name', content: 'Draft Duck' },
            { property: 'og:url', content: url },
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { name: 'twitter:card', content: 'summary' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: description }
        ],
        links: [{ rel: 'canonical', href: url }]
    };
}
