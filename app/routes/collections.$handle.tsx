import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {
  Image,
  Money
} from '@shopify/hydrogen';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {transformToShopifyStructure, PaginationBar} from '@fast-simon/storefront-kit';
import {Filters} from '~/components/Filters';
import {Narrow} from '@fast-simon/utilities';
export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

export async function loader(args: LoaderFunctionArgs) {

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const facets = {facets: criticalData.collection.getFacetsOnly ? criticalData.collection.getFacetsOnly() : criticalData.collection.facets};

  return defer({...criticalData, ...facets});
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
  const {storefront, fastSimon} = context;

  if (!handle) {
    throw redirect('/collections');
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const narrowString = url.searchParams.get('filters');
  const narrow = narrowString ? Narrow.toServerNarrow(Narrow.parseNarrow(narrowString || '')) : []
  const collection = await fastSimon.getSmartCollection({
    props: {
      categoryURL: '/collections/' + handle,
      page,
      narrow: narrow,
      facetsRequired: true,
      productsPerPage: 20,
      categoryID: undefined,
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
  const {collection, facets} = useLoaderData<typeof loader>();

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>
      <div className={"results-filters-container"}>
        <Filters facets={facets} />
        <div className={'fs-products-summary'}>
          <div className={'fs-summary'}>
            <div className={'fs-page-name'}>{collection.category_name}</div>
            <div className={'fs-total-results'}>{collection.total_results} Results</div>
          </div>
          <ProductsGrid products={collection.products.nodes} />
        </div>
      </div>
      <br />
      <PaginationBar total={collection.total_p} />
    </div>
  );
}
function ProductsGrid({products}) {
  return (
    <div className="products-grid">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}
function ProductItem({
                       product,
                       loading,
                     }: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions).replace('?=', '');
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
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
