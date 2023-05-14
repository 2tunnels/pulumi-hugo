import algoliasearch from "algoliasearch/lite";
import { autocomplete, getAlgoliaResults, getAlgoliaFacets } from "@algolia/autocomplete-js";
import { createTagsPlugin } from "@algolia/autocomplete-plugin-tags";
import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches';


// TODO: Global namespace, bro.
const appID = "1174010HRV";
const publicApiKey = "7df9037684fa87409111b2c75ae565bb";
const searchClient = algoliasearch(appID, publicApiKey);
const autocompleteContainer = "#autocomplete";

window.addEventListener("DOMContentLoaded", () => {

    const initialQuery = new URL(window.location.href).searchParams.get("search");

    if (document.querySelector(autocompleteContainer)) {
        initAutocomplete(autocompleteContainer, initialQuery);
    }
});

window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "k" && event.metaKey) {
        event.preventDefault();

        const input = document
            .querySelector(autocompleteContainer)
            .querySelector("input[type='search']") as HTMLInputElement;

        input.focus();
    }
});

function mapToAlgoliaFilters(tagsByFacet, operator = "AND") {
    const result = Object
        .keys(tagsByFacet)
        .map(facet => {
            return `(${tagsByFacet[facet]
                .map(({ label }) => `${facet}:"${label}"`)
                .join(' OR ')})`;
        })
        .join(` ${operator} `);

    // console.log({ result });
    return result;
}

function groupBy(items, predicate) {
    return items.reduce((acc, item) => {
        const key = predicate(item);

        if (!acc.hasOwnProperty(key)) {
            acc[key] = [];
        }

        acc[key].push(item);
        return acc;
    }, {});
}

function initAutocomplete(container, initialQuery) {

    const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
        key: 'RECENT_SEARCH',
        limit: 5,
    });

    const baseTags = [
        {
            label: "Docs",
            facet: "section",
        },
        {
            label: "Registry",
            facet: "section",
        },
        {
            label: "Blog",
            facet: "section",
        },
        {
            label: "Templates",
            facet: "section",
        },
    ];

    const tagsPlugin = createTagsPlugin({
        initialTags: baseTags,
        transformSource: ({ source }) => {
            return undefined;
        },
        getTagsSubscribers: () => {
            return [
                {
                    sourceId: "section",
                    getTag: ({ item }) => {
                        return item;
                    },
                },
            ];
        }
    });

    const ac = autocomplete({
        container,
        openOnFocus: false,
        placeholder: "Search the docs",
        initialState: {
            query: initialQuery,
        },
        onStateChange: ({ state, prevState, refresh, setContext }) => {
            // console.log("onStateChange", { state });
            // setContext({
            //     facets: state.collections
            // })
        },
        // onReset: ({ refresh, state }) => {
        //     console.log("onReset");
        //     refresh();
        // },
        // reshape: ({ sources, state, }) => {
        //     return sources
        //         .filter(source => {
        //             return source.sourceId === "results";
        //         });
        // },
        getSources: ({ query, state, setCollections, setQuery, refresh, setContext }) => {
            return [
                {
                    sourceId: "sections",

                    // getItems() is called whenever the bound input value changes.
                    getItems: ({  }) => {
                        return getAlgoliaFacets({
                            searchClient,
                            queries: [
                                {
                                    indexName: "pulumi",
                                    facet: "section",
                                    params: {
                                        query,
                                        filters: mapToAlgoliaFilters(
                                            groupBy(
                                                (state.context.tagsPlugin as any).tags,
                                                (tag: any) => {
                                                    return tag.facet as string;
                                                },
                                            ),
                                        ),
                                    },
                                },
                            ],
                            transformResponse({ facetHits }) {
                                setContext({
                                    facetHits,
                                })
                                return [];
                            }
                        })
                    },
                    getItemInputValue: ({ item }) => {
                        // console.log("getItemInputValue", { item });
                        return item.query as string;
                    },
                    onSelect: ({ item, event }) => {
                        event.stopPropagation();
                        // console.log(item.label);
                        // (state.context.tagsPlugin as any).setTags([ { label: item.label, facet: "section" } ]);
                        (state.context.tagsPlugin as any).setTags(baseTags);
                        refresh();
                        // console.log("onSelect", { item })
                    },
                    templates: {
                        header: ({ items, state, html }) => {
                            return html`
                                <ul class="flex flex-wrap items-center justify-items-start text-sm px-1.5 py-2 mb-2">
                                    ${ items.map(tag => html`
                                        <li class="mr-4">
                                            <button
                                                onclick="${ event => {
                                                    event.stopPropagation();
                                                    (state.context.tagsPlugin as any).setTags([ { label: tag.label, facet: "section" } ]);
                                                    refresh();
                                                }}">
                                                <span>
                                                    <span class="font-semibold mr-1">${ tag.label }</span>
                                                    <span class="text-gray-700">${ tag.count }</span>
                                                </span>
                                            </button>
                                        </li>
                                    `)}
                                    <li>
                                        <button
                                            onclick="${ event => {
                                                event.stopPropagation();
                                                (state.context.tagsPlugin as any).setTags(baseTags);
                                                refresh();
                                            }}">
                                            <span class="font-semibold mr-1">Show all</span>
                                        </button>
                                    </li>
                                </ul>
                            `
                        },
                        item: ({ item, components, html, render }) => {
                            return null;
                        },
                    },
                },
                {
                    sourceId: "results",
                    getItems: ({  }) => {
                        return getAlgoliaResults({
                            searchClient,
                            queries: [
                                {
                                    indexName: "pulumi",
                                    query,
                                    params: {
                                        filters: mapToAlgoliaFilters(
                                            groupBy(
                                                (state.context.tagsPlugin as any).tags,
                                                // baseTags,
                                                (tag: any) => {
                                                    return tag.facet as string;
                                                },
                                            ),
                                        ),
                                        hitsPerPage: 20,
                                    },
                                },
                            ],
                        })
                    },
                    getItemUrl: ({ item, state }) => {
                        const url = new URL([document.location.origin, item.href].join(""));
                        return url.toString();
                    },
                    templates: {
                        header: ({ items, html, state }) => {
                            console.log({ state });

                            const matchingTags = baseTags
                                .filter(tag => items.find(item => item.section === tag.label))
                                .map(tag => {
                                    return {
                                        ...tag,
                                        count: items.filter(item => item.section === tag.label).length,
                                    };
                                });

                            const facetHits = state.context.facetHits[0] as any[];

                            return html`
                                <ul class="flex flex-wrap items-center justify-items-start text-sm px-1.5 py-2 mb-2">
                                    ${ facetHits.map(tag => html`
                                        <li class="mr-4">
                                            <button
                                                onclick="${ event => {
                                                    event.stopPropagation();
                                                    (state.context.tagsPlugin as any).setTags([ { label: tag.label, facet: "section" } ]);
                                                    refresh();
                                                }}">
                                                <span>
                                                    <span class="font-semibold mr-1">${ tag.label }</span>
                                                    <span class="text-gray-700">${ tag.count }</span>
                                                </span>
                                            </button>
                                        </li>
                                    `)}
                                    <li>
                                        <button
                                            onclick="${ event => {
                                                event.stopPropagation();
                                                (state.context.tagsPlugin as any).setTags(baseTags);
                                                refresh();
                                            }}">
                                            <span class="font-semibold mr-1">Show all</span>
                                        </button>
                                    </li>
                                </ul>

                                <ul class="text-sm px-1.5 py-2 mb-2">
                                    Showing ${ items.length } results from ${ matchingTags.map(t => t.label).join(", ") }.
                                </ul>
                            `
                        },
                        item: ({ item, components, html }) => {
                            // console.log("item", { item });
                            return html`
                                <a class="block my-1 px-1 py-0.5" href="${ item.href }">
                                    <div class="mb-2 text-xs">
                                        <div class="float-right text-gray-600 border rounded border-gray-400 py-0.5 px-1">
                                            ${ item.section }
                                        </div>
                                        <div class="font-semibold leading-relaxed">
                                            ${ components.Highlight({ hit: item, attribute: "title" }) }
                                        </div>
                                        <div class="mt-1.5 text-gray-700 leading-relaxed">
                                            ${ components.Highlight({ hit: item, attribute: "description" }) }
                                        </div>

                                    </div>
                                </a>
                            `;
                        },
                        noResults: ({ components, html }) => {
                            return html`
                                <div class="mb-2">
                                    <div class="text-xs font-semibold">No results found.</div>
                                </div>
                            `;
                        },
                        footer: ({ state, components, html }) => {
                            return html`
                                <div class="my-2 mx-0.5 pt-4 border-t border-gray-300 px-1">
                                    <div class="text-xs text-gray-700">
                                        Not the results you were looking for? <a class="underline text-blue-500" href="/ai/?prompt=${ encodeURIComponent(state.query) }">Try Pulumi AI</a>.
                                    </div>
                                </div>
                            `;
                        },
                    },
                },
            ];
        },
        plugins: [
            tagsPlugin,
            recentSearchesPlugin,
        ],
    });
}
