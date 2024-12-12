import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {
  Analytics,
  CacheLong,
  Image,
  Money,
} from '@shopify/hydrogen';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {transformToShopifyStructure, PaginationBar, FastSimonReporting} from '@fast-simon/storefront-kit';
import {Filters} from '~/components/Filters';
import {Narrow} from '@fast-simon/utilities';
import {ResultsSummary} from '~/components/ResultsSummary';
import {SortByContainer} from '~/components/SortByContainer';
export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

export async function loader(args: LoaderFunctionArgs) {

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const facets = {facets: criticalData.collection.getFacetsOnly ? criticalData.collection.getFacetsOnly() : criticalData.collection.facets};
  const dashboardConfig = {dashboardConfig: args.context.fastSimon.getDashboardConfig({cacheStrategy: CacheLong()})};
  return defer({...criticalData, ...facets, ...dashboardConfig});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
                                  context,
                                  params,
                                  request,
                                }: LoaderFunctionArgs) {
  const {handle} = params;
  const {fastSimon} = context;

  if (!handle) {
    throw redirect('/collections');
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const narrowString = url.searchParams.get('filters');
  const sortBy = url.searchParams.get('sort');
  const narrow = narrowString ? Narrow.toServerNarrow(Narrow.parseNarrow(narrowString || '')) : []
  const collection = await fastSimon.getSmartCollection({
    props: {
      categoryURL: '/collections/' + handle,
      page,
      narrow: narrow,
      facetsRequired: true,
      productsPerPage: 20,
      categoryID: undefined,
      sortBy: sortBy
    },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  const transformed = transformToShopifyStructure(collection.items);
  collection.products = transformed.products;
  collection.handle = collection.category_url.split('/')[1];
  collection.title = collection.category_name;
  collection.description = collection.category_description;
  return {
    collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

export default function Collection() {
  const {collection, facets, dashboardConfig} = useLoaderData<typeof loader>();
  const onProductClick = (productId) => {
    FastSimonReporting.prepareProductSeenFromCollectionData({
      productId,
      productPosition: collection.items.findIndex(item => item.id === productId) + 1,
      sortBy: collection.sort_by,
      pageNumber: collection.p,
      categoryId: collection.category_id,
      categoryName: collection.category_name
    });
  }
  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>
      <div className={"results-filters-container"}>
        <Filters facets={facets} />
        <div className={'fs-products-summary'}>
          <div className={'fs-summary-and-sort-container'}>
            <ResultsSummary numberOfResults={collection.total_results} pageTitle={collection.category_name}/>
            <SortByContainer serverSort={collection.sort_by} dashboardConfig={dashboardConfig}/>
          </div>
          <ProductsGrid products={collection.products.nodes} onProductClick={onProductClick}/>
        </div>
      </div>
      <br />
      <PaginationBar total={collection.total_p} />
      <Analytics.CollectionView data={{collection: {handle: collection.handle, id: collection.category_id}}} customData={collection} />
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
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions).replace('?=', '');

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
          sizes="(min-width: 45em) 400px, calc(50vw - 2rem)"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
