import {type ActionFunctionArgs, defer, json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, type MetaFunction, useLoaderData} from '@remix-run/react';
import {Analytics, CacheLong, Image, Money} from '@shopify/hydrogen';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {getEmptyPredictiveSearchResult, type PredictiveSearchReturn, type RegularSearchReturn} from '~/lib/search';
import {ProductItemFragment} from '../../storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {FastSimonReporting, PaginationBar, transformToShopifyStructure} from '@fast-simon/storefront-kit';
import {Narrow} from '@fast-simon/utilities';
import {Filters} from '~/components/Filters';
import {ResultsSummary} from '~/components/ResultsSummary';
import {SortByContainer} from '~/components/SortByContainer';

export const meta: MetaFunction = () => {
  return [{title: `Fast Simon For Shopify Hydrogen | Search Results`}];
};

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({request, context})
    : regularSearch({request, context});

  searchPromise.catch((error: Error) => {
    console.error(error);
    return {term: '', result: null, error: error.message};
  });
  const data = await searchPromise;

  if(data?.type === 'regular') {
    const facets = {facets: data.result.getFacetsOnly ? data.result.getFacetsOnly() : data.result.facets};
    const dashboardConfig = {dashboardConfig: context.fastSimon.getDashboardConfig({cacheStrategy: CacheLong()})};
    return defer({...data, ...facets, ...dashboardConfig});
  }
  return json(data);
}

async function getFastSimonAutocompleteResults({request, context}: LoaderFunctionArgs) {
  const {fastSimon} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();

  return await fastSimon.getAutocompleteResults({
    props: {
      query: term
    }
  });
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  const {type, term, result, error, facets, dashboardConfig} = useLoaderData<typeof loader>();
  if (type === 'predictive') return null;
  const onProductClick = (productId: string) => {
    FastSimonReporting.prepareProductSeenFromSerpData({
      productId,
      productPosition: result.ids.findIndex(id => id === productId) + 1,
      query: term,
      sortBy: result.sort_by,
      pageNumber: result.p
    })
  }
  return (
    <div className="search">
      <h1>Search</h1>
      <SearchForm>
        {({inputRef}) => (
          <>
            <input
              defaultValue={term}
              name="q"
              placeholder="Search…"
              ref={inputRef}
              type="search"
            />
            &nbsp;
            <button type="submit" className={'search-button'}>Search</button>
          </>
        )}
      </SearchForm>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!term || !result?.total ? (
        <SearchResults.Empty />
      ) : (
        <>
          <div className={"results-filters-container"}>
            <Filters facets={facets} />
            <div className={'fs-products-summary'}>
              <div className={'fs-summary-and-sort-container'}>
                <ResultsSummary numberOfResults={result.term} pageTitle={result.total}/>
                <SortByContainer serverSort={result.sort_by} dashboardConfig={dashboardConfig}/>
              </div>
              <ProductsGrid products={result.items.products.nodes} onProductClick={onProductClick}/>
            </div>
          </div>

          <br />
          <PaginationBar total={result.total_p} />
        </>
      )}
      <Analytics.SearchView data={{searchTerm: term, searchResults: result}} customData={result} />
    </div>
  );
}

function ProductsGrid({products, onProductClick}) {
  return (
    <div className="products-grid">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
            onProductClick={onProductClick}
          />
        );
      })}
    </div>
  );
}
function ProductItem({
                       product,
                       loading,
                       onProductClick
                     }: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
  onProductClick: (productId: string) => void;
}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
      onClick={() => onProductClick(product.id)}
    >
      {product.featuredImage && (
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="0.714"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
    variants(first: 1) {
      nodes {
        id
        image {
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
        product {
          handle
          title
        }
      }
    }
  }
` as const;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
` as const;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
  }
` as const;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $first,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: $first,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: RELEVANCE,
      types: [PRODUCT],
      unavailableProducts: HIDE,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

/**
 * Regular search fetcher
 */
async function regularSearch({
                               request,
                               context,
                             }: Pick<
  LoaderFunctionArgs,
  'request' | 'context'
>): Promise<RegularSearchReturn> {
  const {fastSimon} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '');
  const page = Number(url.searchParams.get('page') || 1);
  const sortBy = url.searchParams.get('sort');
  const narrowString = url.searchParams.get('filters');
  const narrow = narrowString ? Narrow.toServerNarrow(Narrow.parseNarrow(narrowString || '')) : []

  const fastSimonSearchResults = await fastSimon.getSearchResults({
    props: {
      page: page,
      narrow: narrow,
      facetsRequired: 1,
      query: term,
      productsPerPage: 20,
      sortBy: sortBy
    }
  });

  if (!fastSimonSearchResults) {
    throw new Error('No search data returned from FastSimon API');
  }

  const transformed = transformToShopifyStructure(fastSimonSearchResults.items);
  const facets = fastSimonSearchResults.getFacetsOnly ? fastSimonSearchResults.getFacetsOnly() : {};
  return {type: 'regular', term, error: undefined, result: {total: fastSimonSearchResults.total_results, ...fastSimonSearchResults, ...facets, items: transformed}};
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    variants(first: 1) {
      nodes {
        id
        image {
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
` as const;

/**
 * Predictive search fetcher
 */
async function predictiveSearch({
                                  request,
                                  context,
                                }: Pick<
  ActionFunctionArgs,
  'request' | 'context'
>): Promise<PredictiveSearchReturn> {
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();

  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  const {items} = await getFastSimonAutocompleteResults({request, context});

  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  items.products = items.products.map(item => ({
    ...item,
    t: (item?.t2 || item?.t)?.replace('_large.', '.'),
    t2: item.t
  }))

  const total = Object.values(items).reduce(
    (acc, item) => acc + item.length,
    0,
  );

  return {type, term, result: {items, total}};
}
